/**
 * 视频推荐数据 — 由 build.js 自动生成
 * 请勿手动修改此文件，在 /admin 后台管理视频
 * 生成时间：2026-08-11T14:09:00.885Z
 */
const VIDEOS = [
  {
    "id": 1,
    "title": "【9分钟搞定！Claude Code 保姆级安装+原理+真实用法（国内直连）】",
    "url": "https://www.bilibili.com/video/BV1KjoxBoEQJ?vd_source=b38574ddf86e11695b9ec862f7edee0f",
    "platform": "bilibili",
    "file": "",
    "cover": "images/qq20260727-205130.png",
    "description": "<p>安装claude code,注意cc-switch是终端运行</p>",
    "category": "教程",
    "date": "2026-07-27 00:00:00"
  },
  {
    "id": 2,
    "title": "【王道计算机考研 数据结构】",
    "url": "https://www.bilibili.com/video/BV1b7411N798?p=13&vd_source=b38574ddf86e11695b9ec862f7edee0f",
    "platform": "bilibili",
    "file": "",
    "cover": "images/qq20260727-222055.png",
    "description": "<p>数据结构**++**</p>",
    "category": "数据结构",
    "date": "2026-07-27 00:00:00"
  },
  {
    "id": 3,
    "title": "示例视频",
    "url": "https://www.bilibili.com/video/BV1GJ411x7h7",
    "platform": "bilibili",
    "file": "",
    "cover": "",
    "description": "<p>这是一个示例视频推荐。</p>\n<p>可以在这里写推荐语，支持 Markdown。</p>",
    "category": "教程",
    "date": "2026-07-27 00:00:00"
  }
];

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

function getVideoById(id) {
  return VIDEOS.find(item => item.id === id) || null;
}
