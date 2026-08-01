/**
 * 路由模块
 * 解析 URL Hash，支持 #/、#/post/:id、#/tag/:tag、#/about、#/search
 */
const Router = {
  /** 当前路由信息 */
  current: { page: 'home', params: {} },

  /** 已注册的路由处理函数 */
  _handlers: {},

  /** 注册路由 */
  on(page, handler) {
    this._handlers[page] = handler;
    return this;
  },

  /** 解析当前 hash */
  parse() {
    const hash = location.hash.slice(1) || '/';

    // #/post/1
    let match = hash.match(/^\/post\/(\d+)$/);
    if (match) {
      this.current = { page: 'post', params: { id: parseInt(match[1]) } };
      return this.current;
    }

    // #/tag/xxx
    match = hash.match(/^\/tag\/(.+)$/);
    if (match) {
      this.current = { page: 'tag', params: { tag: decodeURIComponent(match[1]) } };
      return this.current;
    }

    // #/about
    if (hash === '/about') {
      this.current = { page: 'about', params: {} };
      return this.current;
    }

    // #/gallery/:id（数字 → 详情页）
    match = hash.match(/^\/gallery\/(\d+)$/);
    if (match) {
      this.current = { page: 'gallery-item', params: { id: parseInt(match[1]) } };
      return this.current;
    }

    // #/gallery/xxx（分类筛选）
    match = hash.match(/^\/gallery\/(.+)$/);
    if (match) {
      this.current = { page: 'gallery', params: { category: decodeURIComponent(match[1]) } };
      return this.current;
    }

    // #/gallery
    if (hash === '/gallery') {
      this.current = { page: 'gallery', params: {} };
      return this.current;
    }

    // #/music/tag/xxx（必须在 #/music/xxx 之前）
    match = hash.match(/^\/music\/tag\/(.+)$/);
    if (match) {
      this.current = { page: 'music', params: { tag: decodeURIComponent(match[1]) } };
      return this.current;
    }

    // #/music/artist/xxx
    match = hash.match(/^\/music\/artist\/(.+)$/);
    if (match) {
      this.current = { page: 'music', params: { artist: decodeURIComponent(match[1]) } };
      return this.current;
    }

    // #/music/:id（数字 → 详情页，必须在 #/music/xxx 之前）
    match = hash.match(/^\/music\/(\d+)$/);
    if (match) {
      this.current = { page: 'music-item', params: { id: parseInt(match[1]) } };
      return this.current;
    }

    // #/music/xxx（兼容旧的 category 路由）
    match = hash.match(/^\/music\/(.+)$/);
    if (match) {
      this.current = { page: 'music', params: { category: decodeURIComponent(match[1]) } };
      return this.current;
    }

    // #/music
    if (hash === '/music') {
      this.current = { page: 'music', params: {} };
      return this.current;
    }

    // #/video/:id（数字 → 详情页）
    match = hash.match(/^\/video\/(\d+)$/);
    if (match) {
      this.current = { page: 'video-item', params: { id: parseInt(match[1]) } };
      return this.current;
    }

    // #/video/xxx（分类筛选）
    match = hash.match(/^\/video\/(.+)$/);
    if (match) {
      this.current = { page: 'video', params: { category: decodeURIComponent(match[1]) } };
      return this.current;
    }

    // #/video
    if (hash === '/video') {
      this.current = { page: 'video', params: {} };
      return this.current;
    }

    // #/novel/:id/:chapterId（必须在 #/novel/:id 之前）
    match = hash.match(/^\/novel\/(\d+)\/(\d+)$/);
    if (match) {
      this.current = { page: 'novel-chapter', params: { id: parseInt(match[1]), chapterId: parseInt(match[2]) } };
      return this.current;
    }

    // #/novel/:id
    match = hash.match(/^\/novel\/(\d+)$/);
    if (match) {
      this.current = { page: 'novel', params: { id: parseInt(match[1]) } };
      return this.current;
    }

    // #/novel
    if (hash === '/novel') {
      this.current = { page: 'novel-list', params: {} };
      return this.current;
    }

    // #/search?q=xxx
    match = hash.match(/^\/search\?q=(.*)$/);
    if (match) {
      this.current = { page: 'search', params: { q: decodeURIComponent(match[1]) } };
      return this.current;
    }

    // #/posts（文章专页）
    if (hash === '/posts') {
      this.current = { page: 'posts', params: {} };
      return this.current;
    }

    // #/ (home)
    if (hash === '/' || hash === '') {
      this.current = { page: 'home', params: {} };
      return this.current;
    }

    // 404
    this.current = { page: '404', params: {} };
    return this.current;
  },

  /** 导航到指定路由 */
  navigate(hash) {
    location.hash = hash;
  },

  /** 执行当前路由的处理函数 */
  run() {
    this.parse();
    const handler = this._handlers[this.current.page];
    if (handler) {
      handler(this.current.params);
    } else {
      this._handlers['404']({});
    }
    this._updateActiveNav();
  },

  /** 更新导航栏激活状态 */
  _updateActiveNav() {
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (this.current.page === 'home' && href === '#/') {
        link.classList.add('active');
      } else if (this.current.page === 'about' && href === '#/about') {
        link.classList.add('active');
      } else if (this.current.page === 'gallery' && href === '#/gallery') {
        link.classList.add('active');
      } else if (this.current.page === 'gallery-item' && href === '#/gallery') {
        link.classList.add('active');
      } else if (this.current.page === 'music' && href === '#/music') {
        link.classList.add('active');
      } else if (this.current.page === 'music-item' && href === '#/music') {
        link.classList.add('active');
      } else if (this.current.page === 'video' && href === '#/video') {
        link.classList.add('active');
      } else if (this.current.page === 'video-item' && href === '#/video') {
        link.classList.add('active');
      } else if (this.current.page.startsWith('novel') && href === '#/novel') {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  },

  /** 初始化，监听 hashchange */
  init() {
    window.addEventListener('hashchange', () => this.run());
    this.run();
  }
};
