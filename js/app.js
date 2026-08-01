/**
 * 应用入口
 * 初始化主题、路由，注册各页面的渲染逻辑
 */
(function () {
  'use strict';

  // ===== 初始化主题 =====
  Theme.init();

  // ===== 初始化页面主题（季节装饰）=====
  PageTheme.init();

  // ===== 主题切换按钮 =====
  document.getElementById('theme-toggle').addEventListener('click', () => {
    Theme.toggle();
  });

  // ===== 注册路由处理 =====
  Router
    .on('home', () => {
      Render.mount(Render.home(null, null));
    })
    .on('posts', () => {
      const posts = getAllPosts();
      Render.mount(Render.home(posts, null, null, 'post'));
    })
    .on('tag', (params) => {
      const posts = getPostsByTag(params.tag);
      const title = posts.length > 0 ? params.tag : '标签';
      Render.mount(Render.home(posts, params.tag));
    })
    .on('post', (params) => {
      const post = getPostById(params.id);
      if (!post) {
        Render.mount(Render.notFound());
        return;
      }
      const allPosts = getAllPosts();
      const idx = allPosts.findIndex(p => p.id === post.id);
      const prevPost = idx < allPosts.length - 1 ? allPosts[idx + 1] : null;
      const nextPost = idx > 0 ? allPosts[idx - 1] : null;
      Render.mount(Render.post(post, prevPost, nextPost));
      setTimeout(() => { if (typeof Giscus !== 'undefined') Giscus.load('post-' + post.id); }, 100);
    })
    .on('search', (params) => {
      const posts = searchPosts(params.q);
      Render.mount(Render.home(posts, null, `🔍 搜索结果："${params.q}"（${posts.length} 篇）`));

      // 高亮搜索结果
      if (params.q) {
        setTimeout(() => {
          document.querySelectorAll('.post-card-title, .post-card-excerpt').forEach(el => {
            el.innerHTML = Search.highlight(el.textContent, params.q);
          });
        }, 0);
      }
    })
    .on('about', () => {
      Render.mount(Render.about());
      const d = (typeof ABOUT_DATA !== 'undefined') ? ABOUT_DATA : {};
      if (d.qq && d.qqPassword) {
        setTimeout(() => Render.setupAboutPassword(d.qqPassword), 0);
      }
    })
    .on('gallery', (params) => {
      const items = params.category
        ? getGalleryByCategory(params.category)
        : getAllGalleryItems();
      Render.mount(Render.gallery(items, params.category || null));
    })
    .on('gallery-item', (params) => {
      const item = getGalleryItemById(parseInt(params.id));
      if (!item) { Render.mount(Render.notFound()); return; }
      Render.mount(Render.galleryDetail(item));
      setTimeout(() => { if (typeof Giscus !== 'undefined') Giscus.load('gallery-' + item.id); }, 100);
    })
    .on('music', (params) => {
      let tracks;
      if (params.tag) {
        tracks = getMusicByTag(params.tag);
      } else if (params.artist) {
        tracks = getMusicByArtist(params.artist);
      } else if (params.category) {
        tracks = getMusicByCategory(params.category);
      } else {
        tracks = getAllMusicTracks();
      }

      // 读取 localStorage 播放次数附加到 tracks
      let playCounts = {};
      try { playCounts = JSON.parse(localStorage.getItem('music_play_counts') || '{}'); } catch {}

      tracks = tracks.map(t => ({
        ...t,
        _plays: playCounts[t.title] || 0,
      }));

      // 默认按播放次数排序
      tracks.sort((a, b) => (b._plays - a._plays) || new Date(b.date || 0) - new Date(a.date || 0));

      Render.mount(Render.music(tracks, params.tag || null, params.artist || null, true));
      setTimeout(() => Render.setupMusicPlayers(), 0);
    })
    .on('music-item', (params) => {
      const track = getMusicTrackById(parseInt(params.id));
      if (!track) { Render.mount(Render.notFound()); return; }
      Render.mount(Render.musicDetail(track));
      setTimeout(() => { if (typeof Giscus !== 'undefined') Giscus.load('music-' + track.id); }, 100);
    })
    .on('video', (params) => {
      const items = params.category
        ? getVideosByCategory(params.category)
        : getAllVideos();
      Render.mount(Render.video(items, params.category || null));
      // 初始化视频播放器
      setTimeout(() => Render.setupVideoPlayers(), 0);
    })
    .on('video-item', (params) => {
      const item = getVideoById(parseInt(params.id));
      if (!item) { Render.mount(Render.notFound()); return; }
      Render.mount(Render.videoDetail(item));
      setTimeout(() => { if (typeof Giscus !== 'undefined') Giscus.load('video-' + item.id); }, 100);
    })
    .on('novel-list', () => {
      const novels = getAllNovels();
      Render.mount(Render.novelList(novels));
    })
    .on('novel', (params) => {
      const novel = getNovelById(params.id);
      if (!novel) { Render.mount(Render.notFound()); return; }
      Render.mount(Render.novelDetail(novel));
      setTimeout(() => Render.setupNovelPage(), 0);
    })
    .on('novel-chapter', (params) => {
      const result = getNovelChapter(params.id, params.chapterId);
      if (!result) { Render.mount(Render.notFound()); return; }
      Render.mount(Render.novelChapter(
        result.novel, result.chapter, result.prev, result.next, result.allChapters
      ));
      setTimeout(() => Render.setupNovelPage(), 0);
      setTimeout(() => { if (typeof Giscus !== 'undefined') Giscus.load('novel-' + params.id + '-' + params.chapterId); }, 100);
    })
    .on('404', () => {
      Render.mount(Render.notFound());
    });

  // ===== 绑定搜索 =====
  Search.bind();
  Search.initOverlay();

  // ===== 初始化点赞 =====
  if (typeof Likes !== 'undefined') {
    Likes.init();
  }

  // ===== 启动路由 =====
  Router.init();

  // ===== 点击页面标题回到顶部（点击 logo 刷新首页）=====
  document.querySelector('.site-logo').addEventListener('click', (e) => {
    if (location.hash === '#/' || location.hash === '' || location.hash === '#') {
      e.preventDefault();
      Router.init(); // 重新渲染首页
    }
  });

  // ===== 移动端汉堡菜单 =====
  const navToggle = document.getElementById('nav-toggle');
  const siteNav = document.getElementById('site-nav');

  if (navToggle && siteNav) {
    const closeNav = () => {
      siteNav.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.textContent = '☰';
    };

    navToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.textContent = isOpen ? '✕' : '☰';
    });

    // 点击导航链接后自动关闭
    siteNav.addEventListener('click', (e) => {
      if (e.target.closest('.nav-link')) {
        closeNav();
      }
    });

    // 路由变化时关闭菜单
    window.addEventListener('hashchange', closeNav);

    // 点击菜单外部关闭
    document.addEventListener('click', (e) => {
      if (siteNav.classList.contains('nav-open') &&
          !siteNav.contains(e.target) &&
          e.target !== navToggle &&
          !navToggle.contains(e.target)) {
        closeNav();
      }
    });
  }

  // ===== 返回顶部按钮 =====
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          const shouldShow = window.scrollY > 300;
          backToTopBtn.classList.toggle('visible', shouldShow);
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

})();
