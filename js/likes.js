/**
 * 点赞模块
 * 使用 CountAPI 存储全局计数 + localStorage 记住用户已点赞状态
 */
const Likes = {
  NS: 'my-blog',

  /** 获取当前用户已点赞的项目集合 */
  _liked() {
    try { return JSON.parse(localStorage.getItem('blog_liked') || '[]'); }
    catch { return []; }
  },

  _saveLiked(arr) {
    localStorage.setItem('blog_liked', JSON.stringify(arr));
  },

  /** 检查是否已点赞 */
  isLiked(type, id) {
    return this._liked().includes(`${type}-${id}`);
  },

  /** 获取点赞数（从 CountAPI） */
  async getCount(type, id) {
    try {
      const resp = await fetch(`https://api.countapi.xyz/get/${this.NS}/${type}-${id}`);
      if (!resp.ok) return 0;
      const data = await resp.json();
      return data.value || 0;
    } catch {
      return 0;
    }
  },

  /** 批量获取点赞数 */
  async getCounts(items) {
    // items: [{ type, id }, ...]
    const results = {};
    await Promise.all(items.map(async ({ type, id }) => {
      results[`${type}-${id}`] = await this.getCount(type, id);
    }));
    return results;
  },

  /** 点赞/取消点赞（只允许点赞，不给取消） */
  async like(type, id) {
    const key = `${type}-${id}`;
    const liked = this._liked();
    if (liked.includes(key)) return null; // 已点赞

    try {
      const resp = await fetch(`https://api.countapi.xyz/hit/${this.NS}/${key}`);
      if (!resp.ok) return null;
      const data = await resp.json();
      liked.push(key);
      this._saveLiked(liked);
      return data.value;
    } catch {
      return null;
    }
  },

  /** 渲染点赞按钮 HTML（数据属性版本，由事件委托处理） */
  buttonHTML(type, id, liked) {
    const key = `${type}-${id}`;
    return `<button class="like-btn ${liked ? 'like-btn-liked' : ''}"
                    data-like-type="${type}" data-like-id="${id}"
                    title="${liked ? '已点赞' : '点赞'}" aria-label="点赞">
              <span class="like-btn-icon">${liked ? '❤️' : '🤍'}</span>
              <span class="like-btn-count" data-like-count="${key}">0</span>
            </button>`;
  },

  /** 初始化：事件委托 + 加载所有点赞数 */
  init() {
    // 事件委托：点击点赞按钮
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.like-btn');
      if (!btn) return;

      const type = btn.dataset.likeType;
      const id = btn.dataset.likeId;
      if (!type || !id) return;

      e.preventDefault();
      e.stopPropagation();

      const icon = btn.querySelector('.like-btn-icon');
      const countEl = btn.querySelector('.like-btn-count');

      // 如果已点赞，不取消
      if (btn.classList.contains('like-btn-liked')) return;

      // 点赞动画
      btn.style.transform = 'scale(1.3)';
      setTimeout(() => { btn.style.transform = ''; }, 200);

      const newCount = await this.like(type, id);
      if (newCount !== null) {
        btn.classList.add('like-btn-liked');
        if (icon) icon.textContent = '❤️';
        if (countEl) countEl.textContent = newCount;
      }
    });

    // 加载页面中所有点赞计数
    this._loadAllCounts();
  },

  /** 加载页面上所有点赞按钮的计数 */
  async _loadAllCounts() {
    const buttons = document.querySelectorAll('.like-btn');
    if (buttons.length === 0) return;

    // 收集所有需要查询的 type-id
    const keys = new Set();
    buttons.forEach(btn => {
      const type = btn.dataset.likeType;
      const id = btn.dataset.likeId;
      if (type && id) keys.add(`${type}-${id}`);
    });

    // 批量获取计数
    const counts = {};
    await Promise.all([...keys].map(async (key) => {
      try {
        const resp = await fetch(`https://api.countapi.xyz/get/${this.NS}/${key}`);
        if (resp.ok) {
          const data = await resp.json();
          counts[key] = data.value || 0;
        }
      } catch { /* 忽略网络错误 */ }
    }));

    // 更新 DOM
    buttons.forEach(btn => {
      const type = btn.dataset.likeType;
      const id = btn.dataset.likeId;
      const key = `${type}-${id}`;
      const countEl = btn.querySelector('.like-btn-count');
      if (countEl && counts[key] !== undefined) {
        countEl.textContent = counts[key];
        // 如果计数 > 0，给按钮增加热度指示
        if (counts[key] > 0) {
          btn.dataset.likeCount = counts[key];
        }
      }
    });
  }
};
