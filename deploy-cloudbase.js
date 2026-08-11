/**
 * CloudBase 静态托管部署脚本
 * 直接用 SDK 上传，绕开 tcb CLI 在 CI 环境的兼容问题
 *
 * 使用方式: node deploy-cloudbase.js
 * 需要环境变量: TCB_SECRET_ID, TCB_SECRET_KEY
 */
const { CloudBase } = require('@cloudbase/manager-node');
const fs = require('fs');
const path = require('path');

const ENV_ID = 'blog-d4g0rvrjaa17c65a9';
const DEPLOY_DIR = path.resolve(__dirname);

// 需要部署的目录和文件
const DEPLOYMENTS = [
  { localPath: 'index.html', cloudPath: 'index.html' },
  { localPath: 'css', cloudPath: 'css' },
  { localPath: 'js', cloudPath: 'js' },
  { localPath: 'admin', cloudPath: 'admin' },
  { localPath: 'images', cloudPath: 'images' },
  { localPath: 'posts', cloudPath: 'posts' },
  { localPath: 'data', cloudPath: 'data' },
  { localPath: 'assets', cloudPath: 'assets' },
];

async function collectFiles(dirPath, baseDir) {
  const files = [];
  const entries = fs.readdirSync(path.join(baseDir, dirPath), { withFileTypes: true });
  for (const entry of entries) {
    const relPath = path.join(dirPath, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(relPath, baseDir)));
    } else {
      files.push(relPath);
    }
  }
  return files;
}

async function deploy() {
  const secretId = process.env.TCB_SECRET_ID;
  const secretKey = process.env.TCB_SECRET_KEY;

  if (!secretId || !secretKey) {
    console.error('❌ 缺少环境变量 TCB_SECRET_ID 或 TCB_SECRET_KEY');
    process.exit(1);
  }

  console.log('🔗 连接 CloudBase...');
  const app = CloudBase.init({
    env: ENV_ID,
    secretId,
    secretKey,
  });

  const hosting = app.hosting;
  let totalFiles = 0;
  let failedFiles = 0;

  for (const { localPath, cloudPath } of DEPLOYMENTS) {
    const fullLocalPath = path.join(DEPLOY_DIR, localPath);

    if (!fs.existsSync(fullLocalPath)) {
      console.log(`⚠️  跳过不存在的路径: ${localPath}`);
      continue;
    }

    const files = [];
    if (fs.statSync(fullLocalPath).isDirectory()) {
      files.push(...(await collectFiles('', fullLocalPath)));
    } else {
      files.push(localPath);
    }

    console.log(`📤 上传 ${localPath} (${files.length} 个文件)...`);

    for (const file of files) {
      const fileContent = fs.readFileSync(path.join(fullLocalPath, file));
      const cloudFile = path.posix.join(cloudPath, file.replace(/\\/g, '/'));

      try {
        await hosting.uploadFile({
          localPath: path.join(fullLocalPath, file),
          cloudPath: cloudFile,
          fileContent,
        });
        totalFiles++;
      } catch (err) {
        failedFiles++;
        console.error(`❌ 失败: ${cloudFile} — ${err.message}`);
      }
    }
  }

  if (failedFiles > 0) {
    console.error(`⚠️  完成但 ${failedFiles}/${totalFiles + failedFiles} 个文件失败`);
    process.exit(1);
  } else {
    console.log(`✅ 全部 ${totalFiles} 个文件部署成功!`);
  }
}

deploy().catch(err => {
  console.error('❌ 部署异常:', err.message);
  process.exit(1);
});
