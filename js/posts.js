/**
 * 博客文章数据 — 由 build.js 自动生成
 * 请勿手动修改此文件，在 /admin 后台编辑文章
 * 生成时间：2026-07-27T05:44:49.228Z
 */
const POSTS = [
  {
    "id": 29251,
    "title": "111",
    "date": "2026-07-27",
    "excerpt": "万岁嘻嘻嘻",
    "tags": [
      "生活"
    ],
    "cover": "/images/1670183564-2070769768.suf.jpg",
    "content": "<p>顶顶顶</p>"
  },
  {
    "id": 40715,
    "title": "午后的一杯手冲咖啡",
    "date": "2026-07-20",
    "excerpt": "对我来说，冲咖啡这件事本身，就是一种冥想。称豆、研磨、注水，每一个步骤都有它自己的节奏。",
    "tags": [
      "生活",
      "咖啡"
    ],
    "cover": "",
    "content": "<p>每天下午两点，是我固定的咖啡时间。这个习惯已经保持了三年。</p>\n<p>手冲壶里的水烧到 92 度，磨豆机把浅烘的埃塞俄比亚豆子打成粗砂糖大小的颗粒。热水注入的那一刻，咖啡粉膨胀起来，变成一个小小的蘑菇云——我们管这个叫「闷蒸」，是咖啡在和你打招呼。</p>\n<p>我喜欢用手冲壶慢慢画圈，看水滴穿过粉末，透过滤纸，滴进下壶。整个过程大约三分钟，不长不短，刚好够我把思绪从代码的世界里拉回来。</p>\n<h2>为什么是手冲？</h2>\n<p>全自动机器更快、更方便，但它少了参与感。手冲让人慢下来，让你意识到「现在」这件事本身。水温、研磨度、注水速度——这些变量不是烦恼，而是一种掌控感。</p>\n<blockquote>\n<p>咖啡是流淌的哲学，每一杯都是一次小小的实验。</p>\n</blockquote>\n<p>有时我会想，写代码和冲咖啡其实很像：都需要耐心，都需要对细节的关注，而且——当你终于做出一杯（或一个）让自己满意的东西时，那种成就感是一样的。</p>"
  },
  {
    "id": 50588,
    "title": "为什么我选择写博客",
    "date": "2026-07-15",
    "excerpt": "在这个短视频横行的时代，静下来写一篇长文似乎变成了一件奢侈的事。但正因为如此，我觉得它更有价值。",
    "tags": [
      "思考",
      "写作"
    ],
    "cover": "",
    "content": "<p>上一次你完整读完一篇超过两千字的文章，是什么时候？</p>\n<p>我猜很多人需要想一会儿。短视频、碎片化阅读、算法推荐——我们的注意力被切割成越来越小的碎片。这没什么不对，但我觉得，总得有些东西是完整的。</p>\n<h2>写给未来的自己</h2>\n<p>我写博客最大的原因很简单：记录。今天的想法如果不写下来，明天就可能消失。博客是我和未来的自己对话的方式——回头看时，能看到自己走过的路、犯过的错、学会的东西。</p>\n<h2>也写给有缘人</h2>\n<p>互联网上每天产生海量的内容，但大部分都被算法决定谁能看到。博客不一样——它安静地待在那里，等人发现。你不需要讨好算法，只需要真诚地写作。真正对内容感兴趣的人，自然会找到你。</p>\n<blockquote>\n<p>写作是一种抵抗——抵抗遗忘，抵抗浮躁，抵抗被算法定义。</p>\n</blockquote>\n<p>所以，哪怕读者不多，我也会继续写下去。因为每一次按下发布按钮，都是在说：我在这里，我思考过。</p>"
  },
  {
    "id": 22802,
    "title": "从零搭建一个 Node.js API 服务",
    "date": "2026-07-10",
    "excerpt": "这篇文章记录了我从零开始搭建一个 RESTful API 服务的过程，包括项目结构、中间件设计和错误处理。",
    "tags": [
      "技术",
      "Node.js"
    ],
    "cover": "",
    "content": "<p>最近在重构一个老项目，决定从零搭建一个新的 API 服务。这里记录一下我的搭建过程和一些思考。</p>\n<h2>项目初始化</h2>\n<p>我选择了 Express 作为 HTTP 框架，TypeScript 作为开发语言。项目结构大致如下：</p>\n<pre><code>src/\n├── routes/       # 路由层\n├── controllers/  # 控制器\n├── services/     # 业务逻辑\n├── middleware/    # 中间件\n├── utils/        # 工具函数\n└── types/        # 类型定义\n</code></pre>\n<p>分层的好处是每一层都有自己的明确职责。路由只负责路径匹配，控制器处理请求/响应，Service 层封装业务逻辑。</p>\n<h2>错误处理</h2>\n<p>一个容易被忽视但非常重要的点：全局错误处理。</p>\n<p>我习惯定义一个自定义的 <code>AppError</code> 类，包含 HTTP 状态码、错误码和消息。然后在中间件里统一捕获，返回一致的错误格式：</p>\n<pre><code>{\n  &quot;error&quot;: {\n    &quot;code&quot;: &quot;RESOURCE_NOT_FOUND&quot;,\n    &quot;message&quot;: &quot;文章不存在&quot;,\n    &quot;status&quot;: 404\n  }\n}\n</code></pre>\n<p>这样前端拿到错误时，可以统一处理，不用针对各种情况写不同的逻辑。</p>\n<h2>一些心得</h2>\n<p>不要过度设计。刚开始搭建时，很容易想着「万一以后要用呢」，然后引入一堆现在根本不需要的东西。保持简单，等真正需要了再加。</p>"
  },
  {
    "id": 13366,
    "title": "秋日散步偶得",
    "date": "2026-07-05",
    "excerpt": "梧桐叶开始变黄了，空气里有桂花的香气。我放下手机，沿着老街走了很远。",
    "tags": [
      "生活",
      "随笔"
    ],
    "cover": "",
    "content": "<p>今天没有特别的计划，就是想出去走走。</p>\n<p>沿着老街一直走，经过那家开了二十年的包子铺，经过小时候上学的路口。很多东西变了——新的奶茶店、新的公交站牌——但有些东西一直没变。比如拐角那棵老槐树，比我记忆里还要粗壮。</p>\n<h2>慢下来的发现</h2>\n<p>走路的时候我发现了很多平时坐车或骑车时注意不到的东西：墙缝里长出的野花、邻居家新刷的蓝色窗户、路边摊阿姨换了新围裙。这些小细节让这条走了无数遍的路变得新鲜起来。</p>\n<p>我在想，也许「无聊」这件事，并不是因为周围的世界无聊，而是因为我们太快地穿过它。</p>\n<blockquote>\n<p>慢下来，才能看见那些一直存在却被忽略的美好。</p>\n</blockquote>\n<p>回到家，泡了杯茶，把今天看到的东西记在本子上。这就是我这个秋天最惬意的一个下午。</p>"
  },
  {
    "id": 90926,
    "title": "Git 工作流最佳实践",
    "date": "2026-06-28",
    "excerpt": "总结了团队协作中最常用的一些 Git 工作流和 commit 规范，帮助团队保持提交历史的整洁。",
    "tags": [
      "技术",
      "Git"
    ],
    "cover": "",
    "content": "<p>Git 是每个开发者的日常工具，但用好它并不简单。这篇文章总结了一些我在团队中实践的 Git 工作流。</p>\n<h2>分支策略</h2>\n<p>我们采用简化版的 Git Flow：</p>\n<ul>\n<li><strong>main</strong>：生产环境分支，只接受 merge，不直接 commit</li>\n<li><strong>develop</strong>：开发主分支，功能分支从这里切出</li>\n<li><strong>feature/xxx</strong>：功能分支，完成后合并回 develop</li>\n<li><strong>hotfix/xxx</strong>：紧急修复，从 main 切出，合并回 main 和 develop</li>\n</ul>\n<h2>Commit 规范</h2>\n<p>我们使用 Conventional Commits 规范：</p>\n<pre><code>feat: 添加用户登录功能\nfix: 修复文章列表分页错误\ndocs: 更新 README 部署说明\nrefactor: 重构认证中间件\nstyle: 调整按钮圆角\n</code></pre>\n<p>这样做的好处是可以用工具自动生成 CHANGELOG，而且看提交历史一目了然。</p>\n<h2>Code Review</h2>\n<p>每个 PR 至少需要一个人的 approve 才能合并。Review 时关注三个层面：</p>\n<ol>\n<li><strong>正确性</strong>：逻辑对不对，边界情况是否处理</li>\n<li><strong>可读性</strong>：命名是否清晰，注释是否必要</li>\n<li><strong>可维护性</strong>：有没有重复代码，依赖是否合理</li>\n</ol>\n<p>好的 Review 不只是找错，更是知识共享的过程。</p>"
  }
];

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
