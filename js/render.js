/**
 * 渲染模块
 * 负责将数据渲染为 DOM，插入到 #app 容器
 */
/**
 * 解析 LRC 歌词格式
 * 输入: "[00:12.50]歌词文本\n[00:25.00]下一句"
 * 输出: [{ time: 12.5, text: "歌词文本" }, ...]
 */
function parseLRC(lrcText) {
  if (!lrcText || !lrcText.trim()) return [];
  const lines = lrcText.trim().split('\n');
  const result = [];
  const timeRe = /^\[(\d{1,3}):(\d{2})(?:[.:](\d{2,3}))?\]\s*(.*)/;
  for (const line of lines) {
    const match = line.match(timeRe);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const cs = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
      const time = mins * 60 + secs + cs / 1000;
      const text = (match[4] || '').trim();
      if (text) result.push({ time, text });
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

/**
 * 根据当前播放时间找到对应的歌词行索引
 */
function findLyricIndex(lyrics, currentTime) {
  if (!lyrics || lyrics.length === 0) return -1;
  let idx = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) idx = i;
    else break;
  }
  return idx;
}

/**
 * 同步歌词显示：高亮当前行并自动滚动
 * @param {HTMLElement} scrollEl — .music-lyrics-scroll 容器
 * @param {number} currentTime — 音频当前播放时间（秒）
 */
function syncLyricsDisplay(scrollEl, currentTime) {
  const lines = scrollEl.querySelectorAll('.lyric-line');
  if (lines.length === 0) return;

  let activeIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = parseFloat(lines[i].dataset.lyricTime);
    if (!isNaN(t) && currentTime >= t) {
      activeIdx = i;
    } else {
      break;
    }
  }

  // 更新高亮
  const prev = scrollEl.querySelector('.lyric-line.active');
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
}

const Render = {
  app: null,

  /** 获取 #app 容器 */
  getApp() {
    if (!this.app) {
      this.app = document.getElementById('app');
    }
    return this.app;
  },

  /** 清空并渲染内容 */
  mount(html) {
    const el = this.getApp();
    el.innerHTML = html;
  },

  /** 关于页密码验证 */
  setupAboutPassword(hash) {
    const locked = document.getElementById("qq-locked");
    const unlocked = document.getElementById("qq-unlocked");
    const input = document.getElementById("qq-pwd-input");
    const btn = document.getElementById("qq-verify-btn");
    const error = document.getElementById("qq-error");
    if (!locked || !unlocked) return;

    // 已通过验证（sessionStorage）
    if (sessionStorage.getItem("qq_verified") === hash) {
      locked.style.display = "none";
      unlocked.style.display = "block";
      return;
    }

    const doVerify = async () => {
      const pwd = input.value.trim();
      if (!pwd) return;
      const data = new TextEncoder().encode(pwd);
      const buf = await crypto.subtle.digest("SHA-256", data);
      const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
      if (hex === hash) {
        locked.style.display = "none";
        unlocked.style.display = "block";
        sessionStorage.setItem("qq_verified", hash);
        error.style.display = "none";
      } else {
        error.style.display = "block";
        input.value = "";
        input.focus();
      }
    };

    btn.addEventListener("click", doVerify);
    input.addEventListener("keydown", e => { if (e.key === "Enter") doVerify(); });
  },

  /* ========== 首页 ========== */
  home(posts, activeTag, titleOverride) {
    const tags = getAllTags();

    const postsHTML = posts.length === 0
      ? `<div class="empty-state">
           <div class="empty-icon">📭</div>
           <p>暂无文章</p>
         </div>`
      : posts.map(p => this._postCard(p)).join('');

    const title = titleOverride
      || (activeTag ? `标签：${activeTag}（${posts.length} 篇）` : '最新文章');

    return `
      <div class="home-layout">
        <section class="posts-section">
          <h2 class="section-title">${title}</h2>
          <div class="posts-list">${postsHTML}</div>
        </section>
        <aside class="sidebar">
          <div class="sidebar-widget">
            <h3>🔍 搜索</h3>
            <input type="text" class="search-box" id="search-input" placeholder="搜索文章..." autocomplete="off">
          </div>
          <div class="sidebar-widget">
            <h3>🏷️ 标签</h3>
            <div class="tag-cloud">
              <a href="#/" class="tag ${!activeTag ? 'active' : ''}">全部</a>
              ${tags.map(t => `<a href="#/tag/${encodeURIComponent(t.name)}" class="tag ${activeTag === t.name ? 'active' : ''}">${t.name} (${t.count})</a>`).join('')}
            </div>
          </div>
        </aside>
      </div>`;
  },

  /** 文章卡片 HTML */
  _postCard(post) {
    const coverHTML = post.cover
      ? `<div class="post-card-cover"><img src="${post.cover}" alt="${post.title}" loading="lazy"></div>`
      : ''';

    const tagLinks = post.tags.map(t =>
      `<a href="#/tag/${encodeURIComponent(t)}" class="tag" onclick="event.stopPropagation()">${t}</a>`
    ).join('');

    return `
      <article class="post-card" onclick="Router.navigate('#/post/${post.id}')">
        ${coverHTML}
        <h3 class="post-card-title">${post.title}</h3>
        <div class="post-card-meta">
          <span class="post-card-date">${post.date}</span>
        </div>
        <p class="post-card-excerpt">${post.excerpt}</p>
        <div class="post-card-tags">${tagLinks}</div>
      </article>`;
  },

  /* ========== 文章详情 ========== */
  post(post, prevPost, nextPost) {
    const tagsHTML = post.tags.map(t =>
      `<a href="#/tag/${encodeURIComponent(t)}" class="tag">${t}</a>`
    ).join('');

    return `
      <article class="post-detail">
        <a href="#/" class="back-link">← 返回首页</a>
        <header class="post-detail-header">
          <h1>${post.title}</h1>
          <div class="post-detail-meta">
            <span>📅 ${post.date}</span>
          </div>
          <div class="post-detail-tags">${tagsHTML}</div>
        </header>
        <div class="post-detail-body">${post.content}</div>
        <nav class="post-nav">
          <span>${prevPost ? `<a href="#/post/${prevPost.id}">← ${prevPost.title}</a>` : ''}</span>
          <span>${nextPost ? `<a href="#/post/${nextPost.id}">${nextPost.title} →</a>` : ''}</span>
        </nav>
      </article>`;
  },

  /* ========== 关于我（动态数据）========== */
  about() {
    const d = (typeof ABOUT_DATA !== 'undefined') ? ABOUT_DATA : {
      name: '璨泯',
      avatar: '',
      tagline: '一个喜欢写字、写代码、冲咖啡的人',
      bio: '',
      skills: [],
      social: []
    };

    const avatarHTML = d.avatar
      ? `<img src="${d.avatar}" alt="${d.name}" class="about-avatar-img" style="width:120px;height:120px;border-radius:50%;object-fit:cover;">`
      : ''<div class="about-avatar">✍️</div>';

    const skillsHTML = d.skills && d.skills.length > 0
      ? `<div class="skills-section">
           <h2>技术栈</h2>
           ${d.skills.map(s => `
             <div class="skill-item">
               <div class="skill-label"><span>${s.name}</span><span>${s.level}%</span></div>
               <div class="skill-bar"><div class="skill-bar-fill" style="width:${s.level}%"></div></div>
             </div>`).join('')}
         </div>`
      : ''';

    const socialHTML = d.social && d.social.length > 0
      ? `<div class="social-links">
           ${d.social.map(s => `<a href="${s.url}" target="_blank" class="social-link">${s.icon} ${s.label}</a>`).join('')}
         </div>`
      : ''';

    // QQ密码验证区域
    const qqHTML = (d.qq && d.qqPassword)
      ? `<div class="about-qq-section" id="qq-section">
           <div class="about-qq-locked" id="qq-locked">
             <span class="about-qq-icon">🔒</span>
             <span class="about-qq-hint">输入密码查看联系方式</span>
             <div class="about-qq-input-row">
               <input type="password" id="qq-pwd-input" class="about-qq-input" placeholder="输入密码..." autocomplete="off">
               <button id="qq-verify-btn" class="about-qq-btn">验证</button>
             </div>
             <span class="about-qq-error" id="qq-error" style="display:none">密码错误，再试一次</span>
           </div>
           <div class="about-qq-unlocked" id="qq-unlocked" style="display:none">
             <span class="about-qq-icon">✅</span>
             <span class="about-qq-label">QQ：</span>
             <span class="about-qq-number">${d.qq}</span>
           </div>
         </div>`
      : ''

    return `
      <div class="about-page">
        ${avatarHTML}
        <h1>${d.name}</h1>
        <p class="about-tagline">${d.tagline}</p>
        <div class="about-bio">${d.bio}</div>
        ${skillsHTML}
        ${socialHTML}
        ${qqHTML}
      </div>`;
  },

  /* ========== 画廊 ========== */
  gallery(items, activeCategory) {
    const categories = getGalleryCategories();

    const catHTML = `
      <a href="#/gallery" class="tag ${!activeCategory ? 'active' : ''}">全部</a>
      ${categories.map(c =>
        `<a href="#/gallery/${encodeURIComponent(c.name)}"
            class="tag ${activeCategory === c.name ? 'active' : ''}">${c.name} (${c.count})</a>`
      ).join('')}`;

    const itemsHTML = items.length === 0
      ? `<div class="empty-state">
           <div class="empty-icon">🖼️</div>
           <p>暂无图片</p>
         </div>`
      : items.map(item => this._galleryCard(item)).join('');

    return `
      <div class="gallery-page">
        <h2 class="section-title">🖼️ 画廊</h2>
        <div class="gallery-categories">${catHTML}</div>
        <div class="gallery-list">${itemsHTML}</div>
      </div>`;
  },

  /** 画廊卡片 HTML */
  _galleryCard(item) {
    const imageHTML = item.image
      ? `<div class="gallery-card-image">
           <img src="${item.image}" alt="${item.title}" loading="lazy">
         </div>`
      : ''<div class="gallery-card-image gallery-card-placeholder">🖼️</div>';

    return `
      <article class="gallery-card">
        ${imageHTML}
        <div class="gallery-card-body">
          <h3 class="gallery-card-title">${item.title}</h3>
          <div class="gallery-card-meta">${item.date} · ${item.category}</div>
          <div class="gallery-card-desc">${item.description}</div>
        </div>
      </article>`;
  },

  /* ========== 视频 ========== */
  video(items, activeCategory) {
    const categories = getVideoCategories();

    const catHTML = `
      <a href="#/video" class="tag ${!activeCategory ? 'active' : ''}">全部</a>
      ${categories.map(c =>
        `<a href="#/video/${encodeURIComponent(c.name)}"
            class="tag ${activeCategory === c.name ? 'active' : ''}">${c.name} (${c.count})</a>`
      ).join('')}`;

    const itemsHTML = items.length === 0
      ? `<div class="empty-state">
           <div class="empty-icon">🎬</div>
           <p>暂无视频</p>
         </div>`
      : items.map(item => this._videoCard(item)).join('');

    return `
      <div class="video-page">
        <h2 class="section-title">🎬 视频推荐</h2>
        <div class="music-categories">${catHTML}</div>
        <div class="video-list">${itemsHTML}</div>
      </div>`;
  },

  /** 解析视频嵌入链接（返回编码后的 URL） */
  _videoEmbedURL(item) {
    if (item.platform === 'bilibili') {
      const bv = item.url.match(/BV[a-zA-Z0-9]+/);
      if (bv) return `https://player.bilibili.com/player.html?bvid=${bv[0]}&page=1&high_quality=1&autoplay=0`;
      const av = item.url.match(/av(\d+)/i);
      if (av) return `https://player.bilibili.com/player.html?aid=${av[1]}&page=1&high_quality=1&autoplay=0`;
    }
    if (item.platform === 'youtube') {
      const id = item.url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
      if (id) return `https://www.youtube.com/embed/${id[1]}`;
    }
    return null;
  },

  /** 视频卡片 */
  _videoCard(item) {
    const hasLocal = item.file && item.file.trim() !== '';
    const platformIcon = { bilibili: '🅱️', youtube: '▶️', other: '🎬' }[item.platform] || '🎬';
    const embedURL = this._videoEmbedURL(item);

    // 本地视频：直接显示 HTML5 播放器
    let playerHTML;
    if (hasLocal) {
      playerHTML = `<div class="video-local-player">
        <video class="video-local-el" src="${item.file}" controls preload="metadata"
               ${item.cover ? `poster="${item.cover}"` : ''}>
          您的浏览器不支持视频播放
        </video>
      </div>`;
    } else if (embedURL) {
      // 可嵌入的外部播放器
      const coverHTML = item.cover
        ? `<div class="video-card-cover" data-video-cover>
             <img src="${item.cover}" alt="${item.title}" loading="lazy">
             <span class="video-play-icon">▶️</span>
           </div>`
        : `<div class="video-card-cover video-card-cover-placeholder" data-video-cover>
             <span class="video-play-icon">▶️</span>
           </div>`;
      playerHTML = `<div class="video-card-cover-area" data-video-trigger>${coverHTML}</div>
        <div class="video-embed" data-video-embed style="display:none" data-embed-url="${embedURL.replace(/&/g, '&amp;')}"></div>`;
    } else {
      playerHTML = '<div class="video-card-cover video-card-cover-placeholder">🎬</div>';
    }

    // 外部链接
    const externalLink = item.url
      ? `<a href="${item.url}" target="_blank" class="video-external-link">🔗 在 ${item.platform === 'bilibili' ? 'B站' : item.platform === 'youtube' ? 'YouTube' : '原站'} 观看</a>`
      : (hasLocal ? '' : '');

    const badgeHTML = hasLocal
      ? '<span class="video-badge video-badge-local">📁 本地视频</span>'
      : `<span class="video-badge">${platformIcon} ${item.platform}</span>`;

    return `
      <article class="video-card" data-video-card ${hasLocal ? 'data-video-local="true"' : ''}>
        ${playerHTML}
        <div class="video-card-body">
          <div class="video-card-title-row">
            <h3 class="video-card-title">${item.title}</h3>
            ${badgeHTML}
          </div>
          <div class="video-card-meta">${item.date} · ${item.category}</div>
          <div class="video-card-desc">${item.description}</div>
          ${externalLink ? `<div class="video-card-actions">${externalLink}</div>` : ''}
        </div>
      </article>`;
  },

  /** 初始化视频卡片点击播放（事件委托 + 动态创建 iframe） */
  setupVideoPlayers() {
    const app = document.getElementById('app');
    if (!app || app.dataset.videoDelegation === 'true') return;
    app.dataset.videoDelegation = 'true';

    app.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-video-trigger]');
      if (!trigger) return;

      const card = trigger.closest('[data-video-card]');
      if (!card) return;

      const embed = card.querySelector('[data-video-embed]');
      const cover = card.querySelector('[data-video-cover]');
      if (!embed || !cover) return;

      const url = embed.dataset.embedUrl;
      if (!url) return;

      e.preventDefault();
      e.stopPropagation();

      // 动态创建 iframe（避免 HTML 属性转义问题）
      if (!embed.querySelector('iframe')) {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('allow', 'autoplay; encrypted-media');
        iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;';
        embed.appendChild(iframe);
      }

      embed.style.display = 'block';
      cover.style.display = 'none';
    });
  },

  /* ========== 音乐 ========== */

  /** 读取播放次数 */
  _getPlayCounts() {
    try {
      return JSON.parse(localStorage.getItem('music_play_counts') || '{}');
    } catch { return {}; }
  },

  /** 保存播放次数 */
  _savePlayCounts(counts) {
    localStorage.setItem('music_play_counts', JSON.stringify(counts));
  },

  /** 增加播放次数 */
  _incrPlayCount(title) {
    const counts = this._getPlayCounts();
    counts[title] = (counts[title] || 0) + 1;
    this._savePlayCounts(counts);
    return counts[title];
  },

  music(tracks, activeTag, activeArtist, sortByPlays) {
    const allTags = getAllTags();
    const allArtists = getAllArtists();

    // 标签栏
    const tagHTML = `
      <a href="#/music" class="music-tag ${!activeTag && !activeArtist ? 'active' : ''}">全部</a>
      ${allTags.map(t =>
        `<a href="#/music/tag/${encodeURIComponent(t.name)}"
            class="music-tag ${activeTag === t.name ? 'active' : ''}">${t.name} <span class="music-tag-count">${t.count}</span></a>`
      ).join('')}`;

    // 歌手列表
    const artistHTML = allArtists.map(a =>
      `<a href="#/music/artist/${encodeURIComponent(a.name)}"
          class="music-artist-link ${activeArtist === a.name ? 'active' : ''}">🎤 ${a.name} <span class="music-artist-count">${a.count}</span></a>`
    ).join('');

    // 排序按钮
    const sortHTML = `
      <div class="music-sort">
        <button class="music-sort-btn ${sortByPlays ? 'active' : ''}" data-sort="plays">🔥 播放最多</button>
        <button class="music-sort-btn ${!sortByPlays ? 'active' : ''}" data-sort="date">📅 最新发布</button>
      </div>`;

    // 空状态
    const tracksHTML = tracks.length === 0
      ? `<div class="empty-state"><div class="empty-icon">🎵</div><p>暂无歌曲</p></div>`
      : tracks.map(track => this._musicCard(track, sortByPlays)).join('');

    const headerLabel = activeTag
      ? `🏷️ 标签："${activeTag}"（${tracks.length} 首）`
      : activeArtist
        ? `🎤 歌手："${activeArtist}"（${tracks.length} 首）`
        : ''🎵 音乐推荐';

    return `
      <div class="music-page">
        <h2 class="section-title">${headerLabel}</h2>
        <div class="music-filter-bar">
          <div class="music-tags">${tagHTML}</div>
          <div class="music-artists">${artistHTML}</div>
        </div>
        ${sortHTML}
        <div class="music-list">${tracksHTML}</div>
      </div>`;
  },

  /** 音乐卡片 HTML */
  _musicCard(track, sortByPlays) {
    const playUrl = track.neteaseUrl || (track.neteaseId ? `https://music.163.com/song?id=${track.neteaseId}` : '#');
    const hasLocalFile = track.file && track.file.trim() !== '';

    // 播放模式标签
    let badgeHTML = '';
    if (hasLocalFile) {
      badgeHTML = '<span class="music-badge music-badge-local">🎧 完整播放</span>';
    } else if (track.neteaseId) {
      badgeHTML = '<span class="music-badge music-badge-netease">🔗 在线试听</span>';
    }

    let playerHTML;
    if (hasLocalFile) {
      playerHTML = `<div class="music-card-player music-local">
        <div class="cp-wrapper" data-audio-src="${track.file}" data-audio-title="${track.title}">
          <button class="cp-btn cp-play-btn" aria-label="播放" title="播放 / 暂停">
            <span class="cp-icon">▶️</span>
          </button>
          <div class="cp-track-area">
            <div class="cp-progress-bar">
              <div class="cp-progress-fill"></div>
            </div>
            <span class="cp-time-current">0:00</span>
          </div>
          <span class="cp-time-duration">0:00</span>
          <a class="cp-dl-btn" href="${track.file}" download title="下载 MP3" aria-label="下载 MP3">📥</a>
        </div>
        <audio class="cp-audio-el" src="${track.file}" preload="metadata"></audio>
      </div>`;
    } else if (track.neteaseId) {
      playerHTML = `<div class="music-card-player" style="background:#f0f0f0;">
        <iframe frameborder="no" border="0" marginwidth="0" marginheight="0"
                width="330" height="86"
                src="https://music.163.com/outchain/player?type=2&id=${track.neteaseId}&auto=0&height=66">
        </iframe>
        <span class="music-netease-hint">如无法播放，请先<a href="https://music.163.com" target="_blank">登录网易云</a>后刷新</span>
      </div>`;
    } else {
      playerHTML = '<div class="music-card-player music-card-placeholder">🎵</div>';
    }

    // 网易云外链按钮
    const neteaseBtn = (track.neteaseUrl || track.neteaseId)
      ? `<a href="${playUrl}" target="_blank" class="music-netease-btn">🎧 在网易云音乐中打开</a>`
      : ''';

    // 歌词
    const lyricsHTML = (track.lyrics && track.lyrics.trim())
      ? this._lyricsBox(track.lyrics)
      : ''';

    // 封面图
    const coverHTML = track.cover
      ? `<div class="music-card-cover">
           <img src="${track.cover}" alt="${track.title} 封面" loading="lazy">
         </div>`
      : ''';

    // 播放次数
    const counts = this._getPlayCounts();
    const plays = counts[track.title] || 0;
    const playCountHTML = plays > 0
      ? `<span class="music-play-count" title="已播放 ${plays} 次">🔊 ${plays}</span>`
      : ''';

    // 标签
    const tagsHTML = (track.tags || []).map(t =>
      `<a href="#/music/tag/${encodeURIComponent(t)}" class="music-card-tag">${t}</a>`
    ).join('');

    return `
      <article class="music-card" data-date="${track.date}" data-playcount="${plays}">
        ${playerHTML}
        <div class="music-card-body">
          ${coverHTML}
          <div class="music-card-info">
            <div class="music-card-title-row">
              <h3 class="music-card-title">${track.title}</h3>
              ${badgeHTML}
              ${playCountHTML}
            </div>
            <div class="music-card-artist">
              <a href="#/music/artist/${encodeURIComponent(track.artist)}" class="music-card-artist-link-inline">🎤 ${track.artist}</a>
            </div>
            <div class="music-card-meta">${(track.date || '').replace('T', ' ')} · ${track.category}</div>
            ${tagsHTML ? `<div class="music-card-tags">${tagsHTML}</div>` : ''}
            <div class="music-card-desc">${track.description}</div>
            <div class="music-card-actions">
              ${neteaseBtn}
            </div>
          </div>
        </div>
        ${lyricsHTML}
      </article>`;
  },

  /** 生成歌词 HTML（解析 LRC 并渲染为可滚动的歌词列表） */
  _lyricsBox(lrcText) {
    const lines = parseLRC(lrcText);
    if (lines.length === 0) return '';

    const linesHTML = lines.map((line, i) =>
      `<p class="lyric-line" data-lyric-time="${line.time}">${line.text}</p>`
    ).join('\n');

    return `<div class="music-lyrics">
      <div class="music-lyrics-header">📜 歌词</div>
      <div class="music-lyrics-scroll" data-lyrics-scroll>
        ${linesHTML}
      </div>
    </div>`;
  },

  /** 初始化自定义音频播放器（在音乐页面渲染后调用） */
  setupMusicPlayers() {
    const wrappers = document.querySelectorAll('.cp-wrapper');
    wrappers.forEach(wrapper => {
      // 避免重复初始化
      if (wrapper.dataset.initialized === 'true') return;
      wrapper.dataset.initialized = 'true';

      const playBtn = wrapper.querySelector('.cp-play-btn');
      const icon = playBtn ? playBtn.querySelector('.cp-icon') : null;
      const progressBar = wrapper.querySelector('.cp-progress-bar');
      const progressFill = wrapper.querySelector('.cp-progress-fill');
      const timeCurrent = wrapper.querySelector('.cp-time-current');
      const timeDuration = wrapper.querySelector('.cp-time-duration');
      const audio = wrapper.parentElement.querySelector('.cp-audio-el');

      if (!audio || !playBtn || !icon) return;

      // 格式化时间 mm:ss
      const fmt = (s) => {
        if (isNaN(s) || !isFinite(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return m + ':' + String(sec).padStart(2, '0');
      };

      // 加载完成时显示时长
      audio.addEventListener('loadedmetadata', () => {
        timeDuration.textContent = fmt(audio.duration);
      });

      // 更新进度条和时间 + 歌词同步
      audio.addEventListener('timeupdate', () => {
        const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
        progressFill.style.width = pct + '%';
        timeCurrent.textContent = fmt(audio.currentTime);

        // 同步歌词
        const card = wrapper.closest('.music-card');
        if (card) {
          const lyricsScroll = card.querySelector('.music-lyrics-scroll');
          if (lyricsScroll) {
            syncLyricsDisplay(lyricsScroll, audio.currentTime);
          }
        }
      });

      // 播放结束重置
      audio.addEventListener('ended', () => {
        icon.textContent = '▶️';
        progressFill.style.width = '0%';
        timeCurrent.textContent = '0:00';
      });

      // 播放 / 暂停
      playBtn.addEventListener('click', () => {
        if (audio.paused) {
          // 暂停全局播放器
          const gmpAudio = document.getElementById('gmp-audio');
          if (gmpAudio && !gmpAudio.paused) {
            gmpAudio.pause();
            if (typeof GlobalPlayer !== 'undefined') GlobalPlayer._refreshUI();
          }
          // 暂停页面上其他正在播放的音频
          document.querySelectorAll('.cp-audio-el').forEach(el => {
            if (el !== audio && !el.paused) {
              el.pause();
              const sibling = el.parentElement.querySelector('.cp-wrapper');
              if (sibling) {
                const sibIcon = sibling.querySelector('.cp-icon');
                if (sibIcon) sibIcon.textContent = '▶️';
              }
            }
          });
          audio.play().catch(() => {});
          icon.textContent = '⏸️';
          // 播放计数（从头播放时 +1）
          if (audio.currentTime < 0.5) {
            Render._incrPlayCount(wrapper.dataset.audioTitle);
          }
        } else {
          audio.pause();
          icon.textContent = '▶️';
        }
      });

      // 点击进度条跳转
      progressBar.addEventListener('click', (e) => {
        if (!audio.duration || !isFinite(audio.duration)) return;
        const rect = progressBar.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        audio.currentTime = pct * audio.duration;
      });

      // 键盘可访问性
      playBtn.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          playBtn.click();
        }
      });
    });

    // 排序切换按钮
    document.querySelectorAll('.music-sort-btn').forEach(btn => {
      if (btn.dataset.sortInit === 'true') return;
      btn.dataset.sortInit = 'true';
      btn.addEventListener('click', () => {
        const sortBy = btn.dataset.sort;
        const list = document.querySelector('.music-list');
        if (!list) return;
        const cards = [...list.querySelectorAll('.music-card')];
        cards.sort((a, b) => {
          if (sortBy === 'plays') {
            return (parseInt(b.dataset.playcount) || 0) - (parseInt(a.dataset.playcount) || 0);
          }
          return new Date(b.dataset.date || 0) - new Date(a.dataset.date || 0);
        });
        cards.forEach(c => list.appendChild(c));
        document.querySelectorAll('.music-sort-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.sort === sortBy);
        });
      });
    });
  },

  /* ========== 小说列表 ========== */
  novelList(novels) {
    const itemsHTML = novels.length === 0
      ? `<div class="empty-state">
           <div class="empty-icon">📚</div>
           <p>暂无小说</p>
         </div>`
      : novels.map(novel => this._novelCard(novel)).join('');

    return `
      <div class="novel-page">
        <h2 class="section-title">📚 小说</h2>
        <div class="novel-list">${itemsHTML}</div>
      </div>`;
  },

  /** 小说卡片 */
  _novelCard(novel) {
    const statusBadge = novel.status === '连载中'
      ? '<span class="novel-badge novel-badge-ongoing">连载中</span>'
      : ''<span class="novel-badge novel-badge-done">已完结</span>';

    const coverHTML = novel.cover
      ? `<div class="novel-card-cover">
           <img src="${novel.cover}" alt="${novel.title}" loading="lazy">
         </div>`
      : ''<div class="novel-card-cover novel-card-cover-placeholder">📖</div>';

    const descHTML = novel.description
      ? `<div class="novel-card-desc">${novel.description.slice(0, 150)}${novel.description.length > 150 ? '…' : ''}</div>`
      : ''';

    return `
      <a href="#/novel/${novel.id}" class="novel-card-link">
        <article class="novel-card">
          ${coverHTML}
          <div class="novel-card-body">
            <div class="novel-card-title-row">
              <h3 class="novel-card-title">${novel.title}</h3>
              ${statusBadge}
            </div>
            <div class="novel-card-meta">✍️ ${novel.author} · ${novel.genre} · ${novel.wordCount.toLocaleString()} 字</div>
            ${descHTML}
          </div>
        </article>
      </a>`;
  },

  /* ========== 小说详情 ========== */
  novelDetail(novel) {
    const statusBadge = novel.status === '连载中'
      ? '<span class="novel-badge novel-badge-ongoing">连载中</span>'
      : ''<span class="novel-badge novel-badge-done">已完结</span>';

    const coverHTML = novel.cover
      ? `<div class="novel-detail-cover">
           <img src="${novel.cover}" alt="${novel.title}">
         </div>`
      : ''';

    const fanqieLink = novel.fanqieUrl
      ? `<a href="${novel.fanqieUrl}" target="_blank" class="novel-fanqie-btn">📱 在番茄小说阅读</a>`
      : ''';

    // 章节目录
    const tocHTML = novel.volumes.map((vol, vi) => {
      const chaptersHTML = vol.chapters.map(ch => `
        <a href="#/novel/${novel.id}/${ch.id}" class="novel-chapter-link">
          <span class="novel-chapter-link-title">第${ch.id}章 ${ch.title}</span>
          <span class="novel-chapter-link-count">${ch.wordCount ? ch.wordCount.toLocaleString() + ' 字' : ''}</span>
        </a>
      `).join('');

      return `
        <div class="novel-volume">
          <div class="novel-volume-header" data-volume-toggle>
            <span class="novel-volume-arrow">${vi === 0 ? '▽' : '▸'}</span>
            <span class="novel-volume-title">${vol.title}</span>
            <span class="novel-volume-count">${vol.chapters.length} 章</span>
          </div>
          <div class="novel-volume-chapters${vi === 0 ? '' : ' novel-volume-collapsed'}">
            ${chaptersHTML}
          </div>
        </div>`;
    }).join('');

    return `
      <div class="novel-detail-page">
        <div class="novel-detail">
          ${coverHTML}
          <div class="novel-detail-info">
            <h1 class="novel-detail-title">${novel.title}</h1>
            <div class="novel-detail-meta">
              <span>✍️ ${novel.author}</span>
              <span>${statusBadge}</span>
              <span>📂 ${novel.genre}</span>
              <span>📝 ${novel.wordCount.toLocaleString()} 字</span>
            </div>
            <div class="novel-detail-desc">${novel.description}</div>
            <div class="novel-detail-actions">
              ${fanqieLink}
            </div>
          </div>
        </div>
        <div class="novel-toc">
          <h2 class="novel-toc-title">📑 目录</h2>
          ${tocHTML}
        </div>
      </div>`;
  },

  /* ========== 章节阅读 ========== */
  novelChapter(novel, chapter, prev, next, allChapters) {
    const prevHTML = prev
      ? `<a href="#/novel/${novel.id}/${prev.chapterId}" class="novel-chapter-nav-link novel-chapter-nav-prev">← 第${prev.chapterId}章 ${prev.title}</a>`
      : ''<span class="novel-chapter-nav-link novel-chapter-nav-prev novel-chapter-nav-disabled">← 已是第一章</span>';

    const nextHTML = next
      ? `<a href="#/novel/${novel.id}/${next.chapterId}" class="novel-chapter-nav-link novel-chapter-nav-next">第${next.chapterId}章 ${next.title} →</a>`
      : ''<span class="novel-chapter-nav-link novel-chapter-nav-next novel-chapter-nav-disabled">已是最后一章 →</span>';

    // 目录侧栏
    const tocLinksHTML = allChapters.map(ch => `
      <a href="#/novel/${novel.id}/${ch.chapterId}"
         class="novel-toc-drawer-link ${ch.chapterId === chapter.id ? 'novel-toc-drawer-link-active' : ''}">
        <span>第${ch.chapterId}章 ${ch.title}</span>
        <span>${ch.volumeTitle}</span>
      </a>
    `).join('');

    // 找到章节所属卷名
    let volumeTitle = '';
    for (const vol of novel.volumes) {
      if (vol.chapters.some(c => c.id === chapter.id)) {
        volumeTitle = vol.title;
        break;
      }
    }

    // 正文为空时的提示
    const bodyHTML = chapter.content
      ? chapter.content
      : `<div class="novel-chapter-empty">
           <p>📝 此章节内容尚在搬运中……</p>
           <p>请前往 <a href="${novel.fanqieUrl || '#'}" target="_blank">番茄小说</a> 阅读完整内容</p>
         </div>`;

    return `
      <div class="novel-chapter-page">
        <div class="novel-progress" id="novel-progress"></div>
        <div class="novel-chapter-header">
          <div class="novel-chapter-breadcrumb">
            <a href="#/novel/${novel.id}">📚 ${novel.title}</a>
            <span> / </span>
            <span>${volumeTitle}</span>
          </div>
          <h1 class="novel-chapter-title">第${chapter.id}章 ${chapter.title}</h1>
          <div class="novel-chapter-meta">📝 ${chapter.wordCount ? chapter.wordCount.toLocaleString() + ' 字' : ''}</div>
        </div>
        <div class="novel-chapter-body">
          ${bodyHTML}
        </div>
        <div class="novel-chapter-nav">
          ${prevHTML}
          ${nextHTML}
        </div>
      </div>

      <!-- 浮动目录按钮 -->
      <button class="novel-chapter-toc-btn" id="novel-toc-btn" title="目录" aria-label="打开章节目录">📑</button>

      <!-- 目录抽屉遮罩 -->
      <div class="novel-toc-overlay" id="novel-toc-overlay" style="display:none"></div>

      <!-- 目录抽屉 -->
      <div class="novel-toc-drawer" id="novel-toc-drawer" style="display:none">
        <div class="novel-toc-drawer-header">
          <span>📑 ${novel.title}</span>
          <button class="novel-toc-drawer-close" id="novel-toc-drawer-close">✕</button>
        </div>
        <div class="novel-toc-drawer-list">
          ${tocLinksHTML}
        </div>
      </div>
    `;
  },

  /** 初始化小说页面交互（目录折叠、浮动目录按钮、阅读进度条） */
  setupNovelPage() {
    // 卷折叠/展开
    document.querySelectorAll('[data-volume-toggle]').forEach(header => {
      header.addEventListener('click', () => {
        const volume = header.parentElement;
        const chapters = volume.querySelector('.novel-volume-chapters');
        const arrow = header.querySelector('.novel-volume-arrow');
        if (chapters) {
          const isCollapsed = chapters.classList.toggle('novel-volume-collapsed');
          if (arrow) arrow.textContent = isCollapsed ? '▸' : '▽';
        }
      });
    });

    // 浮动目录按钮
    const tocBtn = document.getElementById('novel-toc-btn');
    const tocOverlay = document.getElementById('novel-toc-overlay');
    const tocDrawer = document.getElementById('novel-toc-drawer');
    const tocClose = document.getElementById('novel-toc-drawer-close');

    if (tocBtn && tocOverlay && tocDrawer) {
      const openToc = () => {
        tocOverlay.style.display = 'block';
        tocDrawer.style.display = 'block';
      };
      const closeToc = () => {
        tocOverlay.style.display = 'none';
        tocDrawer.style.display = 'none';
      };
      tocBtn.addEventListener('click', openToc);
      tocOverlay.addEventListener('click', closeToc);
      if (tocClose) tocClose.addEventListener('click', closeToc);
    }

    // 阅读进度条
    const progressBar = document.getElementById('novel-progress');
    if (progressBar) {
      const updateProgress = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
        progressBar.style.width = pct + '%';
      };
      window.addEventListener('scroll', updateProgress, { passive: true });
      updateProgress();
    }
  },

  /* ========== 404 ========== */
  notFound() {
    return `
      <div class="not-found">
        <h2>404</h2>
        <p>哎呀，这个页面不存在呢~</p>
        <a href="#/" class="back-home">返回首页</a>
      </div>`;
  }
};
