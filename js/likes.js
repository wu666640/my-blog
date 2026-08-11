/**
 * 点赞模块
 * 使用 localStorage 存储点赞状态和计数，支持点赞/取消点赞切换
 */
const Likes = {
  KEY_LIKED: 'blog_liked',
  KEY_COUNTS: 'blog_like_counts',

  /** 已点赞集合 ['posts-1', 'music-2', ...] */
  _liked() {
    try { return JSON.parse(localStorage.getItem(this.KEY_LIKED) || '[]'); }
    catch { return []; }
  },

  _saveLiked(arr) {
    localStorage.setItem(this.KEY_LIKED, JSON.stringify(arr));
  },

  /** 点赞计数 { 'posts-1': 5, 'music-2': 3, ... } */
  _counts() {
    try { return JSON.parse(localStorage.getItem(this.KEY_COUNTS) || '{}'); }
    catch { return {}; }
  },

  _saveCounts(obj) {
    localStorage.setItem(this.KEY_COUNTS, JSON.stringify(obj));
  },

  /** 是否已点赞 */
  isLiked(type, id) {
    return this._liked().includes(`${type}-${id}`);
  },

  /** 获取点赞数 */
  getCount(type, id) {
    const key = `${type}-${id}`;
    const counts = this._counts();
    return counts[key] || 0;
  },

  /** 点赞 */
  _doLike(type, id) {
    const key = `${type}-${id}`;
    const liked = this._liked();
    if (liked.includes(key)) return null;

    liked.push(key);
    this._saveLiked(liked);

    const counts = this._counts();
    counts[key] = (counts[key] || 0) + 1;
    this._saveCounts(counts);

    return counts[key];
  },

  /** 取消点赞 */
  _doUnlike(type, id) {
    const key = `${type}-${id}`;
    const liked = this._liked();
    const idx = liked.indexOf(key);
    if (idx === -1) return null;

    liked.splice(idx, 1);
    this._saveLiked(liked);

    const counts = this._counts();
    if (counts[key] && counts[key] > 0) {
      counts[key] = Math.max(0, counts[key] - 1);
    }
    this._saveCounts(counts);

    return counts[key] || 0;
  },

  /** 渲染点赞按钮 HTML */
  buttonHTML(type, id, liked) {
    const count = this.getCount(type, id);
    return `<button class="like-btn ${liked ? 'like-btn-liked' : ''}"
                    data-like-type="${type}" data-like-id="${id}"
                    title="${liked ? '取消点赞' : '点赞'}" aria-label="${liked ? '取消点赞' : '点赞'}">
              <span class="like-btn-icon">${liked ? '❤️' : '🤍'}</span>
              <span class="like-btn-count">${count > 0 ? count : ''}</span>
            </button>`;
  },

  /** 初始化：全局事件委托，支持点赞/取消切换 */
  init() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.like-btn');
      if (!btn) return;

      const type = btn.dataset.likeType;
      const id = btn.dataset.likeId;
      if (!type || !id) return;

      e.preventDefault();
      e.stopPropagation();

      const icon = btn.querySelector('.like-btn-icon');
      const countEl = btn.querySelector('.like-btn-count');
      const isLiked = btn.classList.contains('like-btn-liked');

      // 动画
      btn.style.transform = 'scale(1.3)';
      setTimeout(() => { btn.style.transform = ''; }, 200);

      if (isLiked) {
        // 取消点赞
        const newCount = this._doUnlike(type, id);
        btn.classList.remove('like-btn-liked');
        btn.setAttribute('title', '点赞');
        btn.setAttribute('aria-label', '点赞');
        if (icon) icon.textContent = '🤍';
        if (countEl) countEl.textContent = newCount > 0 ? newCount : '';
      } else {
        // 点赞
        const newCount = this._doLike(type, id);
        if (newCount !== null) {
          btn.classList.add('like-btn-liked');
          btn.setAttribute('title', '取消点赞');
          btn.setAttribute('aria-label', '取消点赞');
          if (icon) icon.textContent = '❤️';
          if (countEl) countEl.textContent = newCount;
        }
      }
    });
  }
};
