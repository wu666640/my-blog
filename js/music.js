/**
 * 音乐推荐数据 — 由 build.js 自动生成
 * 请勿手动修改此文件，在 /admin 后台管理音乐
 * 生成时间：2026-07-27T00:00:00.000Z
 */
const MUSIC_TRACKS = [
  {
    "id": 1,
    "title": "晴天",
    "artist": "周杰伦",
    "description": "<p>一首充满青春回忆的歌。前奏一响，就把人拉回那个夏天。</p>\n<p>「从前从前，有个人爱你很久」— 这句歌词不知道写进了多少人的日记里。</p>",
    "category": "华语流行",
    "file": "",
    "neteaseId": "186016",
    "neteaseUrl": "https://music.163.com/song?id=186016",
    "date": "2026-07-25"
  },
  {
    "id": 2,
    "title": "好久不见",
    "artist": "陈奕迅",
    "description": "<p>Eason 的嗓音有一种独特的魔力，能把最简单的歌词唱进心里。</p>\n<p>每次听到「我来到你的城市，走过你来时的路」，都会想起那些很久没见的人。</p>",
    "category": "粤语/华语",
    "file": "",
    "neteaseId": "65538",
    "neteaseUrl": "https://music.163.com/song?id=65538",
    "date": "2026-07-18"
  },
  {
    "id": 3,
    "title": "成都",
    "artist": "赵雷",
    "description": "<p>因为一首歌，爱上一座城。</p>\n<p>民谣的力量就在于，它用最简单的旋律讲最动人的故事。每次听这首歌都想再去一次成都的街头走一走。</p>",
    "category": "民谣",
    "file": "",
    "neteaseId": "436514312",
    "neteaseUrl": "https://music.163.com/song?id=436514312",
    "date": "2026-07-12"
  }
];

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
