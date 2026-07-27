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
    "lyrics": "",
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
    "lyrics": "",
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
    "lyrics": "",
    "date": "2026-07-12"
  },
  {
    "id": 4,
    "title": "全世界最好的你",
    "artist": "许嵩",
    "description": "<p>我们不期而遇，在最好的年华，遇见了最好的你，而现在我们却形同陌路。缘来缘去缘如水，情散情聚情何归，惜哉痛哉！</p>",
    "category": "华语流行",
    "file": "/images/全世界最好的你-许嵩-jqnxn.mp3",
    "neteaseId": "",
    "neteaseUrl": "",
    "lyrics": "[00:00.00]全世界最好的你\n[00:17.50]——许嵩\n[00:29.01]你是我 最温暖的依靠\n[00:35.58]在茫茫人海中遇见了你\n[00:42.16]不期而遇在那个转角\n[00:48.37]从此再也无法忘记\n[00:54.76]你是我 最甜蜜的烦恼\n[01:01.22]每一天都想和你在一起\n[01:07.87]看日出日落潮起潮消\n[01:14.09]平淡的日子也变得美好\n[01:20.42]全世界最好的你\n[01:26.95]让我懂得了珍惜\n[01:33.48]在最好的年华遇见你\n[01:39.68]是我最大的幸运\n[01:45.94]全世界最好的你\n[01:52.67]虽然如今已分离\n[01:59.04]那些回忆依然清晰\n[02:05.15]永远刻在我心里\n[02:24.88]你是我 最美丽的意外\n[02:31.68]教会了我如何去爱\n[02:38.19]即使现在我们已分开\n[02:44.34]感谢你曾经的存在\n[02:50.70]全世界最好的你\n[02:57.28]让我懂得了珍惜\n[03:03.88]在最好的年华遇见你\n[03:10.05]是我最大的幸运\n[03:16.73]全世界最好的你\n[03:22.98]虽然如今已分离\n[03:29.72]那些回忆依然清晰\n[03:35.76]永远刻在我心里\n[03:42.29]永远刻在我心里",
    "date": "2026-07-27"
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
