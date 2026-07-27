/**
 * 搜索模块
 * 提供防抖搜索、高亮、全局搜索覆盖层
 */
const Search = {
  /** 防抖延迟（毫秒） */
  DELAY: 300,

  _timer: null,
  _overlayTimer: null,

  /**
   * 高亮搜索词
   * @param {string} text - 原始文本
   * @param {string} query - 搜索词
   * @returns {string} 带高亮标记的 HTML
   */
  highlight(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  },

  /**
   * 绑定搜索输入框事件（首页侧栏）
   */
  bind() {
    document.addEventListener('input', (e) => {
      if (e.target.id === 'search-input') {
        this._onInput(e.target.value);
      }
    });
  },

  _onInput(value) {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      const q = value.trim();
      if (q) {
        Router.navigate(`#/search?q=${encodeURIComponent(q)}`);
      } else {
        Router.navigate('#/');
      }
    }, this.DELAY);
  },

  /* ========== 全局搜索覆盖层 ========== */

  /** 搜索所有内容类型 */
  searchAll(query) {
    const q = query.toLowerCase().trim();
    if (!q) return { posts: [], music: [], videos: [] };

    const results = { posts: [], music: [], videos: [] };

    // 搜索文章
    if (typeof POSTS !== 'undefined') {
      results.posts = POSTS.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      ).slice(0, 5);
    }

    // 搜索音乐
    if (typeof MUSIC_TRACKS !== 'undefined') {
      results.music = MUSIC_TRACKS.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.artist || '').toLowerCase().includes(q) ||
        (t.tags || []).some(tag => tag.toLowerCase().includes(q))
      ).slice(0, 5);
    }

    // 搜索视频
    if (typeof VIDEOS !== 'undefined') {
      results.videos = VIDEOS.filter(v =>
        v.title.toLowerCase().includes(q) ||
        (v.description || '').toLowerCase().includes(q) ||
        (v.platform || '').toLowerCase().includes(q)
      ).slice(0, 5);
    }

    return results;
  },

  /** 打开搜索覆盖层 */
  open() {
    const overlay = document.getElementById('search-overlay');
    const input = document.getElementById('search-overlay-input');
    if (!overlay || !input) return;

    overlay.style.display = 'flex';
    input.value = '';
    input.focus();
    document.getElementById('search-overlay-results').innerHTML =
      '<div class="search-overlay-placeholder">输入关键词开始搜索…</div>';
    document.body.style.overflow = 'hidden';
  },

  /** 关闭搜索覆盖层 */
  close() {
    const overlay = document.getElementById('search-overlay');
    if (!overlay) return;
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  },

  /** 渲染搜索结果 */
  _renderResults(results, query) {
    const container = document.getElementById('search-overlay-results');
    if (!container) return;

    const groups = [
      { key: 'posts', label: '📝 文章', icon: '📄' },
      { key: 'music', label: '🎵 音乐', icon: '🎧' },
      { key: 'videos', label: '🎬 视频', icon: '▶️' },
    ];

    let html = '';
    let totalCount = 0;

    for (const g of groups) {
      const items = results[g.key] || [];
      if (items.length === 0) continue;
      totalCount += items.length;

      html += `<div class="search-result-group"><div class="search-result-group-title">${g.label}</div>`;

      items.forEach(item => {
        let url, subtitle;
        if (g.key === 'posts') {
          url = `#/post/${item.id}`;
          subtitle = `${item.date} · ${(item.tags || []).join(' / ')}`;
        } else if (g.key === 'music') {
          url = `#/music`;
          subtitle = `${item.artist} · ${item.category}`;
        } else {
          url = `#/video`;
          subtitle = `${item.platform} · ${item.category}`;
        }

        html += `
          <a href="${url}" class="search-result-item" data-search-link>
            <span class="search-result-icon">${g.icon}</span>
            <div class="search-result-text">
              <div class="search-result-title">${this.highlight(item.title, query)}</div>
              <div class="search-result-sub">${this.highlight(subtitle, query)}</div>
            </div>
          </a>`;
      });

      html += '</div>';
    }

    if (totalCount === 0) {
      html = `<div class="search-overlay-empty">
        <p>🔍 没有找到与 "<strong>${query}</strong>" 相关的内容</p>
      </div>`;
    }

    container.innerHTML = html;
  },

  /** 初始化全局搜索覆盖层 */
  initOverlay() {
    const overlay = document.getElementById('search-overlay');
    const input = document.getElementById('search-overlay-input');
    const backdrop = overlay ? overlay.querySelector('.search-overlay-backdrop') : null;
    const navBtn = document.getElementById('search-nav-btn');

    if (!overlay || !input) return;

    // 打开：nav 按钮
    if (navBtn) {
      navBtn.addEventListener('click', () => this.open());
    }

    // 关闭：点击背景
    if (backdrop) {
      backdrop.addEventListener('click', () => this.close());
    }

    // 关闭：ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.style.display !== 'none') {
        this.close();
      }
      // 快捷键 / 打开（不在输入框中时）
      if (e.key === '/' && overlay.style.display === 'none' &&
          document.activeElement !== input &&
          !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        this.open();
      }
    });

    // 搜索输入
    input.addEventListener('input', () => {
      clearTimeout(this._overlayTimer);
      const q = input.value.trim();
      if (!q) {
        document.getElementById('search-overlay-results').innerHTML =
          '<div class="search-overlay-placeholder">输入关键词开始搜索…</div>';
        return;
      }
      this._overlayTimer = setTimeout(() => {
        const results = this.searchAll(q);
        this._renderResults(results, q);
      }, 200);
    });

    // 点击结果关闭覆盖层
    overlay.addEventListener('click', (e) => {
      if (e.target.closest('[data-search-link]')) {
        this.close();
      }
    });
  }
};
