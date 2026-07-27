/**
 * 全局音乐播放器
 * 在所有页面底部提供歌曲选择和播放，数据来自音乐收藏（MUSIC_TRACKS）
 */
const GlobalPlayer = {
  audio: null,
  tracks: [],
  currentIndex: -1,
  isPlaying: false,

  /* ========== 初始化 ========== */
  init() {
    this.audio = document.getElementById('gmp-audio');
    this.tracks = (typeof MUSIC_TRACKS !== 'undefined') ? [...MUSIC_TRACKS] : [];

    if (this.tracks.length === 0) {
      document.getElementById('gmp-fab').style.display = 'none';
      return;
    }

    this._bindEvents();
    this._restoreState();
  },

  /* ========== 事件绑定 ========== */
  _bindEvents() {
    // FAB 浮动按钮 → 打开/关闭面板
    document.getElementById('gmp-fab').addEventListener('click', () => this.togglePanel());

    // 底部播放栏按钮
    document.querySelector('.gmp-bar-play').addEventListener('click', () => this.togglePlay());
    document.querySelector('.gmp-bar-list').addEventListener('click', () => this.togglePanel());
    document.querySelector('.gmp-bar-close').addEventListener('click', () => this.stop());

    // 进度条点击跳转
    document.querySelector('.gmp-bar-progress-track').addEventListener('click', (e) => {
      if (!this.audio.duration || !isFinite(this.audio.duration)) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.audio.currentTime = pct * this.audio.duration;
    });

    // 面板关闭按钮
    document.querySelector('.gmp-panel-close').addEventListener('click', () => this.hidePanel());

    // 点击面板外关闭
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('gmp-panel');
      const fab = document.getElementById('gmp-fab');
      const listBtn = document.querySelector('.gmp-bar-list');
      if (!panel.classList.contains('gmp-hidden') &&
          !panel.contains(e.target) &&
          e.target !== fab && !fab.contains(e.target) &&
          e.target !== listBtn && !listBtn.contains(e.target)) {
        this.hidePanel();
      }
    });

    // 音频事件
    this.audio.addEventListener('timeupdate', () => this._onProgress());
    this.audio.addEventListener('loadedmetadata', () => this._onProgress());
    this.audio.addEventListener('ended', () => this.next());
    this.audio.addEventListener('play', () => { this.isPlaying = true; this._refreshUI(); });
    this.audio.addEventListener('pause', () => { this.isPlaying = false; this._refreshUI(); });
    this.audio.addEventListener('error', () => this._onError());

    // 页面关闭前保存状态
    window.addEventListener('beforeunload', () => this._saveState());
  },

  /* ========== 播放控制 ========== */
  /** 播放指定索引的歌曲 */
  play(index) {
    const track = this.tracks[index];
    if (!track) return;

    // 无本地文件 → 打开网易云链接
    if (!track.file || !track.file.trim()) {
      const url = track.neteaseUrl || (track.neteaseId ? `https://music.163.com/song?id=${track.neteaseId}` : '#');
      if (url !== '#') window.open(url, '_blank');
      return;
    }

    // 暂停音乐页面的内联播放器
    document.querySelectorAll('.cp-audio-el').forEach(el => {
      if (!el.paused) el.pause();
      const wrapper = el.parentElement.querySelector('.cp-wrapper');
      if (wrapper) {
        const icon = wrapper.querySelector('.cp-icon');
        if (icon) icon.textContent = '▶️';
      }
    });

    this.currentIndex = index;
    this.audio.src = track.file;
    this.audio.load();

    const playPromise = this.audio.play();
    if (playPromise) playPromise.catch(() => {});

    this._refreshUI();
    this._renderPlaylist();
    this.show();
    this.hidePanel();
    this._saveState();
  },

  /** 播放/暂停切换 */
  togglePlay() {
    if (this.currentIndex < 0) {
      // 还没有选歌 → 打开面板
      this.showPanel();
      return;
    }
    if (this.audio.paused) {
      const p = this.audio.play();
      if (p) p.catch(() => {});
    } else {
      this.audio.pause();
    }
  },

  /** 下一首 */
  next() {
    if (this.tracks.length === 0) return;
    let idx = (this.currentIndex + 1) % this.tracks.length;
    const start = idx;
    do {
      const track = this.tracks[idx];
      if (track.file && track.file.trim()) { this.play(idx); return; }
      idx = (idx + 1) % this.tracks.length;
    } while (idx !== start);
    // 没有可播放的曲目
    this.stop();
  },

  /** 上一首 */
  prev() {
    if (this.tracks.length === 0) return;
    let idx = (this.currentIndex - 1 + this.tracks.length) % this.tracks.length;
    const start = idx;
    do {
      const track = this.tracks[idx];
      if (track.file && track.file.trim()) { this.play(idx); return; }
      idx = (idx - 1 + this.tracks.length) % this.tracks.length;
    } while (idx !== start);
    this.stop();
  },

  /** 停止播放 */
  stop() {
    this.audio.pause();
    this.audio.src = '';
    this.currentIndex = -1;
    this.isPlaying = false;
    this._refreshUI();
    this._onProgress();
    this.hide();
    localStorage.removeItem('gmp_state');
  },

  /* ========== UI 显示/隐藏 ========== */
  show() {
    document.getElementById('gmp-bar').classList.remove('gmp-hidden');
    document.getElementById('gmp-fab').classList.add('gmp-playing');
    // 页面底部留出播放栏空间
    document.body.style.paddingBottom = '56px';
    document.getElementById('gmp-fab').style.bottom = '72px';
  },

  hide() {
    document.getElementById('gmp-bar').classList.add('gmp-hidden');
    document.getElementById('gmp-fab').classList.remove('gmp-playing');
    document.body.style.paddingBottom = '';
    document.getElementById('gmp-fab').style.bottom = '';
  },

  togglePanel() {
    const panel = document.getElementById('gmp-panel');
    panel.classList.contains('gmp-hidden') ? this.showPanel() : this.hidePanel();
  },

  showPanel() {
    document.getElementById('gmp-panel').classList.remove('gmp-hidden');
    this._renderPlaylist();
  },

  hidePanel() {
    document.getElementById('gmp-panel').classList.add('gmp-hidden');
  },

  /* ========== 播放列表渲染 ========== */
  _renderPlaylist() {
    const list = document.getElementById('gmp-playlist');
    if (!list) return;

    list.innerHTML = this.tracks.map((track, i) => {
      const isCurrent = i === this.currentIndex;
      const hasLocal = track.file && track.file.trim();

      let statusIcon = '';
      if (isCurrent && this.isPlaying) statusIcon = '<span class="gmp-track-playing">🔊</span>';
      else if (isCurrent) statusIcon = '<span class="gmp-track-paused">⏸</span>';

      const badgeHTML = hasLocal
        ? '<span class="gmp-track-badge gmp-badge-local">🎧</span>'
        : '<span class="gmp-track-badge gmp-badge-netease">🔗</span>';

      const rowClass = isCurrent ? 'gmp-track-item gmp-track-active' : 'gmp-track-item';

      return `
        <div class="${rowClass}" data-index="${i}">
          <span class="gmp-track-status">${statusIcon}</span>
          <div class="gmp-track-info">
            <span class="gmp-track-title">${track.title}</span>
            <span class="gmp-track-artist">${track.artist}</span>
          </div>
          ${badgeHTML}
          <span class="gmp-track-cat">${track.category}</span>
        </div>`;
    }).join('');

    // 点击选歌
    list.querySelectorAll('.gmp-track-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.play(index);
      });
    });
  },

  /* ========== UI 更新 ========== */
  _onProgress() {
    const fill = document.querySelector('.gmp-bar-progress-fill');
    const timeEl = document.querySelector('.gmp-bar-time');
    if (!fill || !timeEl) return;

    const dur = this.audio.duration;
    const cur = this.audio.currentTime;
    if (dur && isFinite(dur)) {
      fill.style.width = (cur / dur * 100) + '%';
      timeEl.textContent = fmtTime(cur) + ' / ' + fmtTime(dur);
    } else {
      fill.style.width = '0%';
      timeEl.textContent = '0:00';
    }
  },

  _refreshUI() {
    const playBtn = document.querySelector('.gmp-bar-play');
    const titleEl = document.querySelector('.gmp-bar-title');
    const artistEl = document.querySelector('.gmp-bar-artist');

    if (this.currentIndex >= 0 && this.tracks[this.currentIndex]) {
      const track = this.tracks[this.currentIndex];
      titleEl.textContent = track.title;
      artistEl.textContent = track.artist;
      if (playBtn) playBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
    } else {
      titleEl.textContent = '选一首歌听听吧';
      artistEl.textContent = '';
      if (playBtn) playBtn.textContent = '▶️';
    }
  },

  _onError() {
    // 当前曲目加载失败，跳过到下一首
    if (this.currentIndex >= 0) {
      const failed = this.currentIndex;
      this.currentIndex = -1;
      this.next();
      // 如果只有这一首，至少重置状态
      if (this.currentIndex < 0) this.stop();
    }
  },

  /* ========== 状态持久化 ========== */
  _saveState() {
    if (this.currentIndex >= 0) {
      localStorage.setItem('gmp_state', JSON.stringify({
        index: this.currentIndex,
        time: this.audio.currentTime || 0,
      }));
    }
  },

  _restoreState() {
    try {
      const saved = JSON.parse(localStorage.getItem('gmp_state'));
      if (saved && saved.index !== undefined && this.tracks[saved.index]) {
        const track = this.tracks[saved.index];
        if (track.file && track.file.trim()) {
          this.currentIndex = saved.index;
          this.audio.src = track.file;
          this.audio.load();
          if (saved.time) this.audio.currentTime = saved.time;
          this._refreshUI();
          this.show();
          // 不自动播放（浏览器策略限制），但恢复界面
        }
      }
    } catch (e) { /* 忽略损坏的状态 */ }
  }
};

/* 时间格式化工具 */
function fmtTime(s) {
  if (isNaN(s) || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + String(sec).padStart(2, '0');
}

/* 启动 */
(function () {
  'use strict';
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GlobalPlayer.init());
  } else {
    GlobalPlayer.init();
  }
})();
