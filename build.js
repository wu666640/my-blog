/**
 * 构建脚本
 * 将 posts/ 目录下的 Markdown 文件编译为 js/posts.js
 * Netlify 部署时自动运行
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
});

const POSTS_DIR = path.join(__dirname, 'posts');
const OUTPUT_FILE = path.join(__dirname, 'js', 'posts.js');

// 读取所有 .md 文件
const files = fs.readdirSync(POSTS_DIR)
  .filter(f => f.endsWith('.md'))
  .sort()
  .reverse(); // 最新的在前

const posts = files.map((filename) => {
  const filePath = path.join(POSTS_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  // 从文件名提取 ID（用文件名哈希，或按顺序分配）
  const slug = filename.replace(/\.md$/, '');
  // 简单哈希 ID
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const id = Math.abs(hash) % 100000;

  // 将 markdown 转为 HTML
  const htmlContent = marked.parse(content);

  return {
    id,
    title: data.title || '无标题',
    date: data.date ? formatDate(data.date) : '未知日期',
    excerpt: data.excerpt || '',
    tags: data.tags || [],
    cover: data.cover || '',
    content: htmlContent.trim(),
  };
});

// 按日期排序
posts.sort((a, b) => {
  if (a.date === '未知日期') return 1;
  if (b.date === '未知日期') return -1;
  return new Date(b.date) - new Date(a.date);
});

function formatDate(d) {
  if (typeof d === 'string') return d;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

// 生成 js/posts.js
const output = `/**
 * 博客文章数据 — 由 build.js 自动生成
 * 请勿手动修改此文件，在 /admin 后台编辑文章
 * 生成时间：${new Date().toISOString()}
 */
const POSTS = ${JSON.stringify(posts, null, 2)};

/**
 * 获取所有文章，按日期降序排列
 */
function getAllPosts() {
  return POSTS.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * 根据 ID 获取文章
 */
function getPostById(id) {
  return POSTS.find(p => p.id === id);
}

/**
 * 获取所有标签及其文章数量
 */
function getAllTags() {
  const tagMap = {};
  POSTS.forEach(post => {
    post.tags.forEach(tag => {
      tagMap[tag] = (tagMap[tag] || 0) + 1;
    });
  });
  return Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

/**
 * 根据标签筛选文章
 */
function getPostsByTag(tag) {
  return POSTS.filter(p => p.tags.includes(tag))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * 搜索文章（匹配标题和摘要）
 */
function searchPosts(query) {
  const q = query.toLowerCase().trim();
  if (!q) return getAllPosts();
  return POSTS.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.excerpt.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q))
  ).sort((a, b) => new Date(b.date) - new Date(a.date));
}
`;

fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
console.log(`✅ 已生成 js/posts.js（${posts.length} 篇文章）`);

// ===== 生成 js/about.js（个人资料）=====
const ABOUT_FILE = path.join(__dirname, 'data', 'about.json');
if (fs.existsSync(ABOUT_FILE)) {
  const aboutData = JSON.parse(fs.readFileSync(ABOUT_FILE, 'utf-8'));
  // 将 bio markdown 转为 HTML
  if (aboutData.bio) {
    aboutData.bio = marked.parse(aboutData.bio).trim();
  }
  const aboutOutput = `/**
 * 个人资料 — 由 build.js 自动生成
 * 请勿手动修改此文件，在 /admin > 个人资料 编辑
 * 生成时间：${new Date().toISOString()}
 */
const ABOUT_DATA = ${JSON.stringify(aboutData, null, 2)};
`;
  fs.writeFileSync(path.join(__dirname, 'js', 'about.js'), aboutOutput, 'utf-8');
  console.log('✅ 已生成 js/about.js');
} else {
  console.log('⚠️  data/about.json 不存在，跳过个人资料生成');
}
