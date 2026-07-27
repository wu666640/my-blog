/**
 * 视频推荐数据 — 由 build.js 自动生成
 * 请勿手动修改此文件，在 /admin 后台管理视频
 * 生成时间：2026-07-27T06:56:09.064Z
 */
const VIDEOS = [
  {
    "id": 1,
    "title": "示例视频",
    "url": "https://www.bilibili.com/video/BV1GJ411x7h7",
    "platform": "bilibili",
    "cover": "",
    "description": "<p>这是一个示例视频推荐。</p>\n<p>可以在这里写推荐语，支持 Markdown。</p>",
    "category": "教程",
    "date": "2026-07-27"
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
