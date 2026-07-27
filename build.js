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

// ===== 生成 js/gallery.js（图片画廊）=====
const GALLERY_FILE = path.join(__dirname, 'data', 'gallery.json');
if (fs.existsSync(GALLERY_FILE)) {
  const galleryData = JSON.parse(fs.readFileSync(GALLERY_FILE, 'utf-8'));
  const items = (galleryData.items || []).map((item, index) => ({
    id: index + 1,
    title: item.title || '无标题',
    description: item.description
      ? marked.parse(item.description).trim()
      : '',
    image: item.image || '',
    category: item.category || '未分类',
    date: item.date || '',
  })).sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  const galleryOutput = `/**
 * 图片画廊数据 — 由 build.js 自动生成
 * 请勿手动修改此文件，在 /admin 后台管理画廊
 * 生成时间：${new Date().toISOString()}
 */
const GALLERY_ITEMS = ${JSON.stringify(items, null, 2)};

/**
 * 获取所有画廊项目，按日期降序排列
 */
function getAllGalleryItems() {
  return GALLERY_ITEMS;
}

/**
 * 获取所有分类及其图片数量
 */
function getGalleryCategories() {
  const catMap = {};
  GALLERY_ITEMS.forEach(item => {
    catMap[item.category] = (catMap[item.category] || 0) + 1;
  });
  return Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

/**
 * 根据分类筛选画廊项目
 */
function getGalleryByCategory(category) {
  return GALLERY_ITEMS.filter(item => item.category === category);
}
`;
  fs.writeFileSync(path.join(__dirname, 'js', 'gallery.js'), galleryOutput, 'utf-8');
  console.log(`✅ 已生成 js/gallery.js（${items.length} 张图片）`);
} else {
  console.log('⚠️  data/gallery.json 不存在，跳过画廊生成');
}

// ===== 生成 js/music.js（音乐推荐）=====
const MUSIC_FILE = path.join(__dirname, 'data', 'music.json');
if (fs.existsSync(MUSIC_FILE)) {
  const musicData = JSON.parse(fs.readFileSync(MUSIC_FILE, 'utf-8'));
  const tracks = (musicData.items || []).map((item, index) => ({
    id: index + 1,
    title: item.title || '未知曲目',
    artist: item.artist || '未知歌手',
    cover: item.cover || '',
    description: item.description
      ? marked.parse(item.description).trim()
      : '',
    category: item.category || '未分类',
    file: item.file || '',
    neteaseId: item.neteaseId || '',
    neteaseUrl: item.neteaseUrl || '',
    lyrics: item.lyrics || '',
    date: item.date || '',
  })).sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  const musicOutput = `/**
 * 音乐推荐数据 — 由 build.js 自动生成
 * 请勿手动修改此文件，在 /admin 后台管理音乐
 * 生成时间：${new Date().toISOString()}
 */
const MUSIC_TRACKS = ${JSON.stringify(tracks, null, 2)};

/**
 * 获取所有音乐，按日期降序排列
 */
function getAllMusicTracks() {
  return MUSIC_TRACKS;
}

/**
 * 获取所有分类及其歌曲数量
 */
function getMusicCategories() {
  const catMap = {};
  MUSIC_TRACKS.forEach(item => {
    catMap[item.category] = (catMap[item.category] || 0) + 1;
  });
  return Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

/**
 * 根据分类筛选音乐
 */
function getMusicByCategory(category) {
  return MUSIC_TRACKS.filter(item => item.category === category);
}
`;
  fs.writeFileSync(path.join(__dirname, 'js', 'music.js'), musicOutput, 'utf-8');
  console.log(`✅ 已生成 js/music.js（${tracks.length} 首歌曲）`);
} else {
  console.log('⚠️  data/music.json 不存在，跳过音乐生成');
}

// ===== 生成 js/video.js（视频推荐）=====
const VIDEO_FILE = path.join(__dirname, 'data', 'video.json');
if (fs.existsSync(VIDEO_FILE)) {
  const videoData = JSON.parse(fs.readFileSync(VIDEO_FILE, 'utf-8'));
  const videos = (videoData.items || []).map((item, index) => ({
    id: index + 1,
    title: item.title || '无标题',
    url: item.url || '',
    platform: item.platform || 'other',
    cover: item.cover || '',
    description: item.description
      ? marked.parse(item.description).trim()
      : '',
    category: item.category || '未分类',
    date: item.date || '',
  })).sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  const videoOutput = `/**
 * 视频推荐数据 — 由 build.js 自动生成
 * 请勿手动修改此文件，在 /admin 后台管理视频
 * 生成时间：${new Date().toISOString()}
 */
const VIDEOS = ${JSON.stringify(videos, null, 2)};

/**
 * 获取所有视频，按日期降序排列
 */
function getAllVideos() {
  return VIDEOS;
}

/**
 * 获取所有分类及其视频数量
 */
function getVideoCategories() {
  const catMap = {};
  VIDEOS.forEach(item => {
    catMap[item.category] = (catMap[item.category] || 0) + 1;
  });
  return Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

/**
 * 根据分类筛选视频
 */
function getVideosByCategory(category) {
  return VIDEOS.filter(item => item.category === category);
}
`;
  fs.writeFileSync(path.join(__dirname, 'js', 'video.js'), videoOutput, 'utf-8');
  console.log(`✅ 已生成 js/video.js（${videos.length} 个视频）`);
} else {
  console.log('⚠️  data/video.json 不存在，跳过视频生成');
}

// ===== 生成 js/novel.js（小说）=====
const NOVEL_FILE = path.join(__dirname, 'data', 'novel.json');
if (fs.existsSync(NOVEL_FILE)) {
  const novelData = JSON.parse(fs.readFileSync(NOVEL_FILE, 'utf-8'));

  const novels = (novelData.novels || []).map((novel) => {
    const chapterDir = path.join(__dirname, novel.chapterDir || 'data/novels/chapters');

    // 扫描目录，自动发现所有 .md 文件
    const chapterFiles = {};
    if (fs.existsSync(chapterDir)) {
      fs.readdirSync(chapterDir)
        .filter(f => f.endsWith('.md'))
        .forEach(f => {
          const match = f.match(/第(\d+)章/);
          if (match) {
            chapterFiles[parseInt(match[1])] = path.join(chapterDir, f);
          }
        });
    }

    // 根据卷的 range 配置组装章节
    const volumes = (novel.volumes || []).map((vol) => {
      const [start, end] = vol.range;
      const chapters = [];
      for (let i = start; i <= end; i++) {
        const filePath = chapterFiles[i];
        if (!filePath) {
          console.log(`⚠️  缺失章节文件: 第${i}章.md`);
          continue;
        }
        const raw = fs.readFileSync(filePath, 'utf-8');
        // 提取标题（第一行 # xxx）
        const titleMatch = raw.match(/^#\s*(?:第[一二三四五六七八九十\d]+章\s*)?(.+)/);
        const chTitle = titleMatch ? titleMatch[1].trim() : `第${i}章`;
        // 去掉第一行标题，剩余为正文
        const body = raw.replace(/^# .+\n\n?/, '');
        const content = marked.parse(body).trim();
        // 统计中文字数
        const chineseChars = body.match(/[一-鿿㐀-䶿]/g);
        const wordCount = chineseChars ? chineseChars.length : 0;

        chapters.push({
          id: i,
          title: chTitle,
          wordCount,
          content,
        });
      }
      return { title: vol.title, chapters };
    });

    // 自动计算总字数
    let totalWordCount = 0;
    volumes.forEach(v => v.chapters.forEach(ch => totalWordCount += ch.wordCount));

    return {
      id: novel.id,
      title: novel.title || '无标题',
      author: novel.author || '佚名',
      cover: novel.cover || '',
      description: novel.description
        ? marked.parse(novel.description).trim()
        : '',
      status: novel.status || '连载中',
      genre: novel.genre || '',
      wordCount: totalWordCount,
      fanqieUrl: novel.fanqieUrl || '',
      volumes,
    };
  });

  const novelOutput = `/**
 * 小说数据 — 由 build.js 自动生成（章节从 data/novels/chapters/ 自动扫描）
 * 请勿手动修改此文件
 * 生成时间：${new Date().toISOString()}
 */
const NOVELS = ${JSON.stringify(novels, null, 2)};

/**
 * 获取所有小说
 */
function getAllNovels() {
  return NOVELS;
}

/**
 * 根据 ID 获取小说
 */
function getNovelById(id) {
  return NOVELS.find(n => n.id === id) || null;
}

/**
 * 获取小说的章节信息（含上下章和完整目录）
 * 返回 { novel, chapter, prev, next, allChapters }
 */
function getNovelChapter(novelId, chapterId) {
  const novel = NOVELS.find(n => n.id === novelId);
  if (!novel) return null;

  let chapter = null;
  let prev = null;
  let next = null;
  const allChapters = [];

  // 遍历卷和章节构建扁平列表
  let lastChapter = null;
  for (const vol of novel.volumes) {
    for (const ch of vol.chapters) {
      const entry = {
        chapterId: ch.id,
        title: ch.title,
        volumeTitle: vol.title,
        wordCount: ch.wordCount || 0,
      };
      allChapters.push(entry);

      if (ch.id === chapterId) {
        chapter = ch;
        prev = lastChapter ? { chapterId: lastChapter.chapterId, title: lastChapter.title, volumeTitle: lastChapter.volumeTitle } : null;
      }
      if (lastChapter && lastChapter.chapterId === chapterId) {
        next = { chapterId: ch.id, title: ch.title, volumeTitle: vol.title };
      }
      lastChapter = entry;
    }
  }
  lastChapter = null; // 第二遍用于找到 next（chapter 找到后下一个）

  if (!chapter) return null;

  return { novel, chapter, prev, next, allChapters };
}
`;
  fs.writeFileSync(path.join(__dirname, 'js', 'novel.js'), novelOutput, 'utf-8');

  let totalChapters = 0;
  novels.forEach(n => n.volumes.forEach(v => totalChapters += v.chapters.length));
  console.log(`✅ 已生成 js/novel.js（${novels.length} 本小说，${totalChapters} 章）`);
} else {
  console.log('⚠️  data/novel.json 不存在，跳过小说生成');
}
