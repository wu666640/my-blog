/**
 * 页面主题模块
 * 管理季节/节日装饰主题：雪花、新年、樱花、落叶 + 角色贴纸
 * 支持粒子动画 + 侧边空白区域贴纸装饰
 */
const PageTheme = {
  KEY: 'blog-page-theme',
  current: 'default',
  particlesContainer: null,
  decorsContainer: null,

  /** 所有可用主题 */
  themes: {
    default:  { name: '默认',   icon: '🎨', particles: false, decors: false },

    /* ---- 季节动画主题 ---- */
    snow:     { name: '雪花❄️', icon: '❄️', particles: true, decors: false,
                count: 35,  emoji: '❄️', sizeMin: 8,  sizeMax: 22,  durMin: 8,  durMax: 16, color: '#d0e8ff' },

    newyear:  { name: '新春🧧', icon: '🧧', particles: true, decors: true,
                count: 18,  emoji: '🏮', sizeMin: 14, sizeMax: 30,  durMin: 10, durMax: 20, color: '#ff4444',
                items: [
                  { side: 'left',  top: 10, emoji: '🏮', size: 55, delay: 0 },
                  { side: 'right', top: 18, emoji: '🧧', size: 65, delay: 0.4 },
                  { side: 'left',  top: 40, emoji: '🏮', size: 60, delay: 0.8 },
                  { side: 'right', top: 50, emoji: '🧧', size: 55, delay: 0.3 },
                  { side: 'left',  top: 68, emoji: '🧨', size: 50, delay: 1.0 },
                  { side: 'right', top: 78, emoji: '🏮', size: 58, delay: 0.6 },
                ]},

    sakura:   { name: '樱花🌸', icon: '🌸', particles: true, decors: false,
                count: 25,  emoji: '🌸', sizeMin: 10, sizeMax: 22,  durMin: 10, durMax: 20, color: '#ffb7c5' },

    autumn:   { name: '落叶🍂', icon: '🍂', particles: true, decors: false,
                count: 20,  emoji: '🍂', sizeMin: 12, sizeMax: 26,  durMin: 8,  durMax: 18, color: '#e8a850' },

    /* ---- 角色贴纸主题 ---- */
    linedog:  { name: '线条小狗🐕', icon: '🐕', particles: false, decors: true,
                items: [
                  // 小狗贴纸（侧边）
                  { side: 'left',  top: 6,  img: 'assets/themes/dog-sit.svg',        size: 85, delay: 0 },
                  { side: 'right', top: 16, img: 'assets/themes/linedog-original.jpg', size: 72, delay: 0.3 },
                  { side: 'left',  top: 30, img: 'assets/themes/dog-run.svg',         size: 95, delay: 0.6 },
                  { side: 'right', top: 42, img: 'assets/themes/dog-jump.svg',        size: 88, delay: 0.4 },
                  { side: 'left',  top: 55, img: 'assets/themes/linedog-original.jpg', size: 78, delay: 0.8 },
                  { side: 'right', top: 66, img: 'assets/themes/dog-sleep.svg',       size: 90, delay: 0.5 },
                  { side: 'left',  top: 78, img: 'assets/themes/dog-bone.svg',        size: 82, delay: 0.9 },
                  // 🐾 蔓延爪印（大号，爬满页面）
                  { side: 'left',  top: 22, emoji: '🐾', size: 55, delay: 1.2, class: 'paw-creep' },
                  { side: 'right', top: 34, emoji: '🐾', size: 48, delay: 1.5, class: 'paw-creep' },
                  { side: 'left',  top: 45, emoji: '🐾', size: 60, delay: 1.8, class: 'paw-creep' },
                  { side: 'right', top: 56, emoji: '🐾', size: 50, delay: 2.1, class: 'paw-creep' },
                  { side: 'left',  top: 68, emoji: '🐾', size: 55, delay: 2.4, class: 'paw-creep' },
                  { side: 'right', top: 80, emoji: '🐾', size: 45, delay: 2.7, class: 'paw-creep' },
                ]},

    batiao:   { name: '八条🐱', icon: '🐱', particles: true, decors: true,
                count: 12,  emoji: '🐾', sizeMin: 10, sizeMax: 20,  durMin: 10, durMax: 18, color: '#a89880',
                items: [
                  { side: 'left',  top: 10, img: 'assets/themes/cat-sit.svg',    size: 85, delay: 0 },
                  { side: 'right', top: 25, img: 'assets/themes/cat-stretch.svg', size: 95, delay: 0.5 },
                  { side: 'left',  top: 42, img: 'assets/themes/cat-play.svg',   size: 88, delay: 0.9 },
                  { side: 'right', top: 58, img: 'assets/themes/cat-lick.svg',   size: 82, delay: 0.3 },
                  { side: 'left',  top: 72, img: 'assets/themes/cat-sit.svg',    size: 80, delay: 1.1 },
                  { side: 'right', top: 82, img: 'assets/themes/cat-stretch.svg', size: 90, delay: 0.7 },
                ]},
  },

  /** 获取当前主题 */
  get() {
    return this.current;
  },

  /** 切换主题 */
  set(theme) {
    if (!this.themes[theme]) return;
    this.current = theme;
    localStorage.setItem(this.KEY, theme);

    // 清除旧装饰
    this._clearParticles();
    this._clearDecors();

    // 生成粒子（雪花等）
    if (this.themes[theme].particles) {
      this._createParticles(theme);
    }

    // 生成侧边贴纸（线条小狗、八条等）
    if (this.themes[theme].decors) {
      this._createDecors(theme);
    }

    // 更新 body 属性（供 CSS 选择器使用）
    document.body.setAttribute('data-page-theme', theme);

    // 更新按钮状态
    this._updateBtn();
  },

  /** 循环切换到下一个主题 */
  next() {
    const keys = Object.keys(this.themes);
    const idx = keys.indexOf(this.current);
    const next = keys[(idx + 1) % keys.length];
    this.set(next);
    return next;
  },

  /** 初始化：从 localStorage 恢复主题 */
  init() {
    // 添加主题按钮
    this._createBtn();
    // 恢复偏好
    const saved = localStorage.getItem(this.KEY);
    if (saved && this.themes[saved]) {
      this.set(saved);
    } else {
      // 自动检测季节
      this.set(this._detectSeason());
    }
  },

  /** 根据当前月份自动检测季节 */
  _detectSeason() {
    const month = new Date().getMonth(); // 0-11
    if (month === 11 || month === 0) return 'snow';
    if (month === 1) return 'newyear';
    if (month >= 2 && month <= 4) return 'sakura';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'default';
  },

  /** 创建主题切换按钮 */
  _createBtn() {
    const nav = document.getElementById('site-nav');
    if (!nav) return;

    const btn = document.createElement('button');
    btn.id = 'page-theme-btn';
    btn.className = 'theme-btn';
    btn.title = '切换页面主题';
    btn.setAttribute('aria-label', '切换页面主题');

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      nav.insertBefore(btn, themeToggle);
    } else {
      nav.appendChild(btn);
    }

    btn.addEventListener('click', () => {
      const theme = this.next();
      this._showToast(this.themes[theme].name + ' 主题');
    });

    this.btn = btn;
    this._updateBtn();
  },

  /** 更新按钮图标 */
  _updateBtn() {
    if (!this.btn) return;
    const t = this.themes[this.current];
    this.btn.textContent = t ? t.icon : '🎨';
  },

  // ========== 粒子动画（雪花、花瓣等）==========

  /** 生成粒子 */
  _createParticles(theme) {
    const config = this.themes[theme];
    if (!config || !config.particles) return;

    const container = document.createElement('div');
    container.id = 'page-theme-particles';
    container.className = 'page-theme-particles';
    container.setAttribute('data-theme', theme);
    document.body.appendChild(container);

    const frag = document.createDocumentFragment();
    for (let i = 0; i < config.count; i++) {
      const particle = document.createElement('span');
      particle.className = 'page-theme-particle';
      particle.textContent = config.emoji;
      particle.style.setProperty('--x', Math.random() * 100 + '%');
      particle.style.setProperty('--size', (config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin)) + 'px');
      particle.style.setProperty('--duration', (config.durMin + Math.random() * (config.durMax - config.durMin)) + 's');
      particle.style.setProperty('--delay', Math.random() * (config.durMax) + 's');
      particle.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
      particle.style.setProperty('--rotation', Math.random() * 360 + 'deg');
      particle.style.setProperty('--opacity', (0.3 + Math.random() * 0.4));
      frag.appendChild(particle);
    }
    container.appendChild(frag);
    this.particlesContainer = container;
  },

  /** 清除粒子 */
  _clearParticles() {
    if (this.particlesContainer) {
      this.particlesContainer.remove();
      this.particlesContainer = null;
    }
    const old = document.getElementById('page-theme-particles');
    if (old) old.remove();
  },

  // ========== 侧边空白区域贴纸装饰 ==========

  /** 创建侧边贴纸（放在内容两侧的空白区域）*/
  _createDecors(theme) {
    const config = this.themes[theme];
    if (!config || !config.decors || !config.items) return;

    const container = document.createElement('div');
    container.id = 'page-decor-container';
    container.className = 'page-decor-container';
    document.body.appendChild(container);

    const frag = document.createDocumentFragment();
    config.items.forEach((item) => {
      const decor = document.createElement('div');
      const extraClass = item.class ? ' ' + item.class : '';
      decor.className = 'page-decor-item page-decor-' + item.side + extraClass;
      decor.style.setProperty('--top', item.top + '%');
      decor.style.setProperty('--size', item.size + 'px');
      decor.style.setProperty('--delay', item.delay + 's');

      if (item.img) {
        // 使用图片
        const img = document.createElement('img');
        img.src = item.img;
        img.alt = '';
        img.loading = 'lazy';
        decor.appendChild(img);
      } else if (item.emoji) {
        // 使用 emoji
        decor.textContent = item.emoji;
      }

      frag.appendChild(decor);
    });
    container.appendChild(frag);

    // 延迟一帧触发入场动画
    requestAnimationFrame(() => {
      container.classList.add('visible');
    });

    this.decorsContainer = container;
  },

  /** 清除侧边贴纸 */
  _clearDecors() {
    if (this.decorsContainer) {
      this.decorsContainer.classList.remove('visible');
      setTimeout(() => {
        if (this.decorsContainer) {
          this.decorsContainer.remove();
          this.decorsContainer = null;
        }
      }, 400);
    }
    const old = document.getElementById('page-decor-container');
    if (old && old !== this.decorsContainer) {
      old.remove();
    }
  },

  // ========== Toast 提示 ==========

  _showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'page-theme-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 1200);
  }
};
