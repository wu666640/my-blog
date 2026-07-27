/**
 * 图片画廊数据 — 由 build.js 自动生成
 * 请勿手动修改此文件，在 /admin 后台管理画廊
 * 生成时间：2026-07-27T14:55:14.251Z
 */
const GALLERY_ITEMS = [
  {
    "id": 4,
    "title": "试验",
    "description": "<p>实验中</p>",
    "image": "images/img_20260714_214239.jpg",
    "category": "壁纸",
    "date": "2026-07-27"
  },
  {
    "id": 2,
    "title": "夕阳下的老街",
    "description": "<p>那天下午散步时拍的，金色的光洒在石板路上。</p>\n<p>梧桐树的影子拉得很长，整条街都变成了暖色调。</p>",
    "image": "images/1670183564-2070769768.suf.jpg",
    "category": "风景",
    "date": "2026-07-20"
  },
  {
    "id": 3,
    "title": "手冲咖啡台",
    "description": "<p>我的咖啡角落，每天下午两点准时营业。</p>\n<p>V60 滤杯、手冲壶、温度计，简单的工具却能带来最纯粹的咖啡体验。</p>",
    "image": "images/img_20260714_214239.jpg",
    "category": "日常",
    "date": "2026-07-15"
  },
  {
    "id": 1,
    "title": "书架一角",
    "description": "<p>最近在读的几本书，窗边的光线正好。</p>\n<p>村上春树的新小说、一本摄影集，还有那本翻了很多遍的诗集。</p>",
    "image": "images/1670183564-2070769768.suf.jpg",
    "category": "日常",
    "date": "2026-07-10"
  }
];

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
