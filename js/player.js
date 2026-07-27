/**
 * 全局音乐播放器
 * 在所有页面底部提供歌曲选择和播放，数据来自音乐收藏（MUSIC_TRACKS）
 */
const GlobalPlayer = {
  audio: null,
  tracks: [],
  currentIndex: -1,
  isPlaying: false,
  shuffle: false,
  loopMode: 'none', // 'none' | 'one' | 'all'

  /* ========== 初始化 ========== */
  init() {
    this.audio = document.getElementById('gmp-audio');
    this.tracks = (typeof MUSIC_TRACKS !== 'undefined') ? [...MUSIC_TRACKS] : [];

    if (this.tracks.length === 0) {
      document.getElementById('gmp-fab').style.display = 'none';
      return;
    }

    // 恢复音量
    const savedVol = localStorage.getItem('gmp_volume');
    this.audio.volume = savedVol !== null ? parseFloat(savedVol) : 0.8;
    this.audio.muted = localStorage.getItem('gmp_muted') === 'true';

    // 恢复播放模式
    this.shuffle = localStorage.getItem('gmp_shuffle') === 'true';
    this.loopMode = localStorage.getItem('gmp_loop') || 'none';
    this._updateShuffleUI();
    this._updateLoopUI();

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

    // 音量控制
    const volumeSlider = document.querySelector('.gmp-volume-slider');
    const volumeBtn = document.querySelector('.gmp-volume-btn');
    if (volumeSlider && volumeBtn) {
      volumeSlider.value = Math.round(this.audio.volume * 100);
      this._updateVolumeIcon(volumeBtn);

      volumeSlider.addEventListener('input', () => {
        const vol = parseInt(volumeSlider.value) / 100;
        this.audio.volume = vol;
        this.audio.muted = false;
        localStorage.setItem('gmp_volume', vol);
        localStorage.setItem('gmp_muted', 'false');
        this._updateVolumeIcon(volumeBtn);
      });

      volumeBtn.addEventListener('click', () => {
        this.audio.muted = !this.audio.muted;
        localStorage.setItem('gmp_muted', String(this.audio.muted));
        this._updateVolumeIcon(volumeBtn);
        volumeSlider.value = Math.round(this.audio.volume * 100);
      });
    }

    // 随机播放
    const shuffleBtn = document.getElementById('gmp-shuffle-btn');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        this.shuffle = !this.shuffle;
        localStorage.setItem('gmp_shuffle', String(this.shuffle));
        this._updateShuffleUI();
      });
    }

    // 循环模式切换: none → one → all → none
    const loopBtn = document.getElementById('gmp-loop-btn');
    if (loopBtn) {
      loopBtn.addEventListener('click', () => {
        const modes = ['none', 'one', 'all'];
        const idx = modes.indexOf(this.loopMode);
        this.loopMode = modes[(idx + 1) % modes.length];
        localStorage.setItem('gmp_loop', this.loopMode);
        this._updateLoopUI();
      });
    }

    // 进度条点击跳转
    document.querySelector('.gmp-bar-progress-track').addEventListener('click', (e) => {
      if (!this.audio.duration || !isFinite(this.audio.duration)) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.audio.currentTime = pct * this.audio.duration;
    });

    // 面板关闭按钮
    document.querySelector('.gmp-panel-close').addEventListener('click', () => this.hidePanel());

    // 歌词 / 列表标签切换
    document.querySelectorAll('.gmp-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.gmpTab;
        this._switchTab(tabName);
      });
    });

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

    // 侧栏歌词关闭按钮
    const sidebarClose = document.querySelector('.lyrics-sidebar-close');
    if (sidebarClose) {
      sidebarClose.addEventListener('click', () => this._hideSidebar());
    }

    // 音频事件
    this.audio.addEventListener('timeupdate', () => {
      this._onProgress();
      this._syncLyrics();
      this._syncSidebarLyrics();
    });
    this.audio.addEventListener('loadedmetadata', () => this._onProgress());
    this.audio.addEventListener('ended', () => {
      if (this.loopMode === 'one') {
        this.audio.currentTime = 0;
        const p = this.audio.play();
        if (p) p.catch(() => {});
        return;
      }
      if (this.loopMode === 'all' && this.tracks.length > 0) {
        this.next();
        return;
      }
      // none: 自然结束，停在最后一首
      if (this.tracks.length > 0 && this.currentIndex < this._lastPlayableIndex()) {
        this.next();
        return;
      }
      // 没有下一首了 → 停止
      this.stop();
    });
    this.audio.addEventListener('play', () => { this.isPlaying = true; this._refreshUI(); this._showSidebar(); });
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
    this._updateLyricsSidebar();
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
    const playable = this._playableIndices();
    if (playable.length === 0) { this.stop(); return; }

    let nextIdx;
    if (this.shuffle) {
      // 随机选一首（排除当前）
      const others = playable.filter(i => i !== this.currentIndex);
      nextIdx = others.length > 0
        ? others[Math.floor(Math.random() * others.length)]
        : playable[0];
    } else {
      // 顺序下一首
      let idx = (this.currentIndex + 1) % this.tracks.length;
      const start = idx;
      let found = false;
      do {
        const track = this.tracks[idx];
        if (track.file && track.file.trim()) { nextIdx = idx; found = true; break; }
        idx = (idx + 1) % this.tracks.length;
      } while (idx !== start);
      if (!found) { this.stop(); return; }
    }

    this.play(nextIdx);
  },

  /** 上一首 */
  prev() {
    if (this.tracks.length === 0) return;
    const playable = this._playableIndices();
    if (playable.length === 0) { this.stop(); return; }

    let prevIdx;
    if (this.shuffle) {
      const others = playable.filter(i => i !== this.currentIndex);
      prevIdx = others.length > 0
        ? others[Math.floor(Math.random() * others.length)]
        : playable[0];
    } else {
      let idx = (this.currentIndex - 1 + this.tracks.length) % this.tracks.length;
      const start = idx;
      let found = false;
      do {
        const track = this.tracks[idx];
        if (track.file && track.file.trim()) { prevIdx = idx; found = true; break; }
        idx = (idx - 1 + this.tracks.length) % this.tracks.length;
      } while (idx !== start);
      if (!found) { this.stop(); return; }
    }

    this.play(prevIdx);
  },

  /** 返回所有可播放曲目的索引 */
  _playableIndices() {
    return this.tracks
      .map((t, i) => t.file && t.file.trim() ? i : -1)
      .filter(i => i >= 0);
  },

  /** 返回最后一个可播放曲目的索引 */
  _lastPlayableIndex() {
    const idxs = this._playableIndices();
    return idxs.length > 0 ? idxs[idxs.length - 1] : -1;
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
    this._hideSidebar();
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
    // 重置到列表标签
    this._switchTab('list');
  },

  /* ========== 标签切换 ========== */
  _switchTab(name) {
    // 更新标签 UI
    document.querySelectorAll('.gmp-tab').forEach(t => {
      t.classList.toggle('gmp-tab-active', t.dataset.gmpTab === name);
    });
    // 切换内容区
    const listEl = document.getElementById('gmp-playlist');
    const lyricsEl = document.getElementById('gmp-lyrics');
    if (name === 'lyrics') {
      listEl.classList.add('gmp-hidden');
      lyricsEl.classList.remove('gmp-hidden');
      this._renderLyrics();
    } else {
      listEl.classList.remove('gmp-hidden');
      lyricsEl.classList.add('gmp-hidden');
      this._renderPlaylist();
    }
  },

  /* ========== 歌词 ========== */
  _renderLyrics() {
    const container = document.getElementById('gmp-lyrics-scroll');
    const emptyHint = document.querySelector('.gmp-lyrics-empty');
    if (!container) return;

    const track = this.tracks[this.currentIndex];
    if (!track || !track.lyrics || !track.lyrics.trim()) {
      container.innerHTML = '';
      if (emptyHint) emptyHint.style.display = 'block';
      return;
    }

    if (emptyHint) emptyHint.style.display = 'none';

    const lines = parseLRC(track.lyrics);
    if (lines.length === 0) {
      if (emptyHint) emptyHint.style.display = 'block';
      return;
    }

    container.innerHTML = lines.map(line =>
      `<p class="gmp-lyric-line" data-lyric-time="${line.time}">${line.text}</p>`
    ).join('');

    // 立即同步一次
    this._syncLyrics();
  },

  _syncLyrics() {
    const scrollEl = document.getElementById('gmp-lyrics-scroll');
    if (!scrollEl || scrollEl.parentElement.classList.contains('gmp-hidden')) return;

    const lines = scrollEl.querySelectorAll('.gmp-lyric-line');
    if (lines.length === 0) return;

    const currentTime = this.audio.currentTime;
    let activeIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      const t = parseFloat(lines[i].dataset.lyricTime);
      if (!isNaN(t) && currentTime >= t) {
        activeIdx = i;
      } else {
        break;
      }
    }

    // 只在歌词行变化时更新高亮和滚动
    const prev = scrollEl.querySelector('.gmp-lyric-line.active');
    if (activeIdx >= 0) {
      const cur = lines[activeIdx];
      if (prev !== cur) {
        if (prev) prev.classList.remove('active');
        cur.classList.add('active');
        // 将当前行滚动到容器 35% 位置，留更多空间给即将到来的歌词
        const lineTop = cur.offsetTop;
        const targetScroll = lineTop - scrollEl.clientHeight * 0.35;
        scrollEl.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
      }
    } else if (prev) {
      prev.classList.remove('active');
    }
  },

  /* ========== 右侧歌词面板 ========== */
  /** 渲染并显示/隐藏侧栏歌词 */
  _updateLyricsSidebar() {
    const sidebar = document.getElementById('lyrics-sidebar');
    if (!sidebar) return;

    const track = this.tracks[this.currentIndex];
    const hasLyrics = track && track.lyrics && track.lyrics.trim();

    if (hasLyrics && this.isPlaying) {
      const songEl = sidebar.querySelector('.lyrics-sidebar-song');
      const artistEl = sidebar.querySelector('.lyrics-sidebar-artist');
      const linesContainer = document.getElementById('lyrics-sidebar-lines');
      const emptyHint = sidebar.querySelector('.lyrics-sidebar-empty');

      if (songEl) songEl.textContent = track.title;
      if (artistEl) artistEl.textContent = track.artist;

      const lines = parseLRC(track.lyrics);
      if (lines.length > 0) {
        linesContainer.innerHTML = lines.map(line =>
          `<p class="lyrics-sb-line" data-sb-time="${line.time}">${line.text}</p>`
        ).join('');
        if (emptyHint) emptyHint.style.display = 'none';
        this._showSidebar();
        this._syncSidebarLyrics();
      } else if (emptyHint) {
        emptyHint.style.display = 'block';
        linesContainer.innerHTML = '';
        this._hideSidebar();
      }
    } else {
      this._hideSidebar();
    }
  },

  /** 同步侧栏歌词高亮和滚动 */
  _syncSidebarLyrics() {
    const sidebar = document.getElementById('lyrics-sidebar');
    if (!sidebar || sidebar.classList.contains('gmp-hidden')) return;

    const lines = sidebar.querySelectorAll('.lyrics-sb-line');
    if (lines.length === 0) return;

    const currentTime = this.audio.currentTime;
    let activeIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      const t = parseFloat(lines[i].dataset.sbTime);
      if (!isNaN(t) && currentTime >= t) {
        activeIdx = i;
      } else {
        break;
      }
    }

    const prev = sidebar.querySelector('.lyrics-sb-line.active');
    if (activeIdx >= 0) {
      const cur = lines[activeIdx];
      if (prev !== cur) {
        if (prev) prev.classList.remove('active');
        cur.classList.add('active');
        const scrollEl = document.getElementById('lyrics-sidebar-scroll');
        if (scrollEl) {
          const lineTop = cur.offsetTop;
          const targetScroll = lineTop - scrollEl.clientHeight * 0.35;
          scrollEl.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
        }
      }
    } else if (prev) {
      prev.classList.remove('active');
    }
  },

  _showSidebar() {
    const sidebar = document.getElementById('lyrics-sidebar');
    if (sidebar) sidebar.classList.remove('gmp-hidden');
  },

  _hideSidebar() {
    const sidebar = document.getElementById('lyrics-sidebar');
    if (sidebar) sidebar.classList.add('gmp-hidden');
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

    // 同步音量图标
    const volumeBtn = document.querySelector('.gmp-volume-btn');
    if (volumeBtn) this._updateVolumeIcon(volumeBtn);
  },

  /** 更新音量图标 */
  _updateVolumeIcon(btn) {
    if (this.audio.muted || this.audio.volume === 0) {
      btn.textContent = '🔇';
    } else if (this.audio.volume < 0.4) {
      btn.textContent = '🔉';
    } else {
      btn.textContent = '🔊';
    }
  },

  /** 更新随机按钮 UI */
  _updateShuffleUI() {
    const btn = document.getElementById('gmp-shuffle-btn');
    if (!btn) return;
    btn.classList.toggle('active', this.shuffle);
    btn.textContent = this.shuffle ? '🔀' : '🔀';
    btn.title = this.shuffle ? '随机播放（已开启）' : '随机播放';
    btn.style.opacity = this.shuffle ? '1' : '0.5';
  },

  /** 更新循环按钮 UI */
  _updateLoopUI() {
    const btn = document.getElementById('gmp-loop-btn');
    if (!btn) return;
    btn.classList.remove('loop-one');
    if (this.loopMode === 'one') {
      btn.classList.add('active', 'loop-one');
      btn.textContent = '🔂';
      btn.title = '单曲循环';
    } else if (this.loopMode === 'all') {
      btn.classList.add('active');
      btn.textContent = '🔁';
      btn.title = '列表循环';
    } else {
      btn.classList.remove('active');
      btn.textContent = '🔁';
      btn.title = '顺序播放';
      btn.style.opacity = '0.5';
    }
    if (this.loopMode !== 'none') btn.style.opacity = '1';
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
