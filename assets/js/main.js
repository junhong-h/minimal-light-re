/* =============================================================
   页面交互
   - 主题：拉绳开关切换浅色 / 深色，并记住访问者的选择
   - 章节导航：滚动时高亮当前章节；点击跳转后标题下划线提示
   - News：默认折叠，只显示前几条
   - Publications：按主题筛选；点击 BibTeX 直接复制
   - 配图 / 照片：点击全屏查看
   ============================================================= */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const live = $('#live');   // 读屏软件播报区域

  /* ---------- 主题 ---------- */
  const root = document.documentElement;
  const lamp = $('.lamp');
  if (lamp) {
    const darkQuery = matchMedia('(prefers-color-scheme: dark)');
    const effective = () => root.dataset.theme || (darkQuery.matches ? 'dark' : 'light');
    const syncLabel = () => lamp.setAttribute('aria-label',
      effective() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    const toggle = () => {
      const next = effective() === 'dark' ? 'light' : 'dark';
      root.classList.add('theme-anim');
      setTimeout(() => root.classList.remove('theme-anim'), 450);
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncLabel();
    };
    darkQuery.addEventListener('change', syncLabel);
    syncLabel();

    // 拉绳：拖动超过阈值松手即切换；直接点击或按键则播放一次"拉"的动画
    const MAX = 44, TRIGGER = 22;
    const rest = () => parseFloat(getComputedStyle(lamp).getPropertyValue('--rest'));
    const setCord = px => px == null ? lamp.style.removeProperty('--cord') : lamp.style.setProperty('--cord', px + 'px');
    let startY = null, dy = 0, dragged = false;

    lamp.addEventListener('pointerdown', e => {
      startY = e.clientY; dy = 0; dragged = false;
      lamp.setPointerCapture(e.pointerId);
      lamp.classList.add('dragging');
    });
    lamp.addEventListener('pointermove', e => {
      if (startY === null) return;
      dy = Math.max(0, Math.min(MAX, e.clientY - startY));
      if (dy > 3) dragged = true;
      setCord(rest() + dy);
    });
    const release = () => {
      if (startY === null) return;
      startY = null;
      lamp.classList.remove('dragging');
      if (dragged && dy >= TRIGGER) toggle();
      setCord(null);                                   // 回弹到静止长度
    };
    lamp.addEventListener('pointerup', release);
    lamp.addEventListener('pointercancel', release);
    lamp.addEventListener('click', () => {
      if (dragged) { dragged = false; return; }        // 拖动已处理，忽略随后的 click
      if (reduceMotion()) return toggle();
      setCord(rest() + 20);                            // 往下拉一下
      setTimeout(() => { toggle(); setCord(null); }, 160);
    });
  }

  /* ---------- 章节导航 ---------- */
  const toc = $('.toc');
  const links = $$('.toc a');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if (toc && sections.length) {
    const tocIsBar = () => getComputedStyle(toc).position === 'sticky';   // 手机端：顶部横向导航
    let lastCurrent = null;
    let navScrolling = false;

    // 横向导航渐隐：右侧还有未显示的章节时提示可滑动
    const fadeHint = () => toc.classList.toggle('more-right', toc.scrollLeft + toc.clientWidth < toc.scrollWidth - 2);
    toc.addEventListener('scroll', fadeHint, { passive: true });

    // 把某一项在横向导航中居中。用瞬间滚动：浏览器同一时间只允许一个平滑滚动，
    // 若这里也用平滑滚动，会打断页面的纵向滚动，导致点击导航后页面不动。
    const centerInToc = a => {
      if (!a || toc.scrollWidth <= toc.clientWidth) return;
      const ar = a.getBoundingClientRect(), tr = toc.getBoundingClientRect();
      toc.scrollLeft += ar.left - tr.left - (tr.width - ar.width) / 2;
    };

    const spy = () => {
      let current = sections[0].id;
      for (const s of sections) if (s.getBoundingClientRect().top <= 120) current = s.id;
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) current = sections[sections.length - 1].id;
      links.forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + current));
      if (current !== lastCurrent && !navScrolling) centerInToc(links.find(l => l.getAttribute('href') === '#' + current));
      lastCurrent = current;
    };

    // 点击导航：计算目标位置（扣除手机端吸附导航的高度）后滚动过去
    links.forEach(a => a.addEventListener('click', e => {
      const sec = $(a.getAttribute('href'));
      if (!sec) return;
      e.preventDefault();
      const offset = tocIsBar() ? toc.offsetHeight + 16 : 32;
      const y = Math.max(0, sec.getBoundingClientRect().top + scrollY - offset);
      navScrolling = true;
      centerInToc(a);
      scrollTo({ top: y, behavior: reduceMotion() ? 'auto' : 'smooth' });
      history.replaceState(null, '', location.pathname + location.search + a.getAttribute('href'));

      // 滚动结束后：确认到位、恢复导航跟随、标题下划线提示、焦点移到该章节标题
      sec.classList.remove('flash'); void sec.offsetWidth;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (Math.abs(scrollY - y) > 40) scrollTo({ top: y, behavior: 'auto' });   // 平滑滚动被打断时直接到位
        navScrolling = false;
        spy();
        sec.classList.add('flash');
        setTimeout(() => sec.classList.remove('flash'), 1700);
        const h = sec.querySelector('h2');
        if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      };
      if (Math.abs(scrollY - y) < 2) return finish();
      if ('onscrollend' in window) addEventListener('scrollend', finish, { once: true });
      setTimeout(finish, 1200);   // 兜底
    }));

    addEventListener('scroll', spy, { passive: true });
    addEventListener('resize', () => { spy(); fadeHint(); });
    spy(); fadeHint();
  }

  /* ---------- News 折叠 ---------- */
  const newsList = $('#news-list');
  const newsBtn = $('#news-toggle');
  if (newsList && newsBtn) {
    const items = $$('li', newsList);
    const show = parseInt(newsList.dataset.show, 10) || 4;
    if (items.length > show) {
      newsBtn.parentElement.hidden = false;
      const render = open => {
        items.forEach((li, i) => { li.hidden = !open && i >= show; });
        newsBtn.setAttribute('aria-expanded', open);
        newsBtn.textContent = open ? 'Show less' : `Show all (${items.length})`;
      };
      newsBtn.addEventListener('click', () => render(newsBtn.getAttribute('aria-expanded') !== 'true'));
      render(false);
    }
  }

  /* ---------- 论文筛选：单选，再次点击当前主题回到 All ---------- */
  const filters = $$('.filter');
  const pubs = $$('.pub');
  if (filters.length) {
    let topic = '';
    const render = () => {
      pubs.forEach(p => { p.hidden = !!topic && !p.dataset.topics.split('|').includes(topic); });
      filters.forEach(b => b.setAttribute('aria-pressed', b.dataset.topic === topic));
    };
    filters.forEach(b => b.addEventListener('click', () => {
      topic = topic === b.dataset.topic ? '' : b.dataset.topic;
      render();
    }));
  }

  /* ---------- BibTeX：点击直接复制 ---------- */
  const copy = async text => {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      const t = document.createElement('textarea');
      t.value = text; document.body.appendChild(t); t.select();
      const ok = document.execCommand('copy'); t.remove(); return ok;
    }
  };
  $$('.bib-btn').forEach(btn => btn.addEventListener('click', async () => {
    const ok = await copy($('.bib', btn.closest('.pub')).textContent);
    const msg = ok ? 'Copied' : 'Copy failed';
    const label = $('span', btn) || btn;               // 只替换文字，保留图标
    btn._label = btn._label || label.textContent;
    btn.style.minWidth = btn.offsetWidth + 'px';      // 避免文字变化导致后面的链接跳动
    label.textContent = msg; btn.classList.add('done');
    if (live) live.textContent = ok ? 'BibTeX copied to clipboard' : msg;
    clearTimeout(btn._t);
    btn._t = setTimeout(() => {
      label.textContent = btn._label; btn.classList.remove('done');
      if (live) live.textContent = '';
    }, 1500);
  }));

  /* ---------- 相册：左右翻页、边缘渐隐、可选的自动循环滚动 ---------- */
  $$('.gallery').forEach(g => {
    const track = $('.gallery-track', g);
    const nav = $('.gallery-nav', g);
    const pauseBtn = $('.gallery-pause', g);
    const prev = $('[data-dir="-1"]', nav), next = $('[data-dir="1"]', nav);
    const originals = $$('li', track);
    const speed = parseFloat(g.dataset.speed) || 30;          // px/秒
    let looping = false, setWidth = 0;

    const overflowing = () => track.scrollWidth - track.clientWidth > 2;
    const update = () => {
      nav.hidden = !looping && !overflowing();                 // 照片不多、不需要滚动时隐藏按钮
      if (looping) { prev.disabled = next.disabled = false; return; }
      const max = track.scrollWidth - track.clientWidth;
      const left = track.scrollLeft > 2, right = track.scrollLeft < max - 2;
      track.classList.toggle('more-left', left);
      track.classList.toggle('more-right', right);
      prev.disabled = !left; next.disabled = !right;
    };

    // 无缝循环：在末尾复制一份照片；滚过第一份的宽度时悄悄跳回开头
    const measure = () => { if (looping) setWidth = $('li.clone', track).offsetLeft - originals[0].offsetLeft; };
    const wrap = () => {
      if (looping && setWidth > 0 && track.scrollLeft >= setWidth) track.scrollLeft -= setWidth;
    };

    // 暂停条件：任意一项成立即暂停
    const paused = { hover: false, focus: false, touch: false, offscreen: false, user: false };
    let resumeAt = 0;                                           // 用户手动操作后，暂停到此时间
    const holdOff = () => { resumeAt = performance.now() + 4000; };
    const lb = $('.lightbox');
    const running = () => looping && !document.hidden && !(lb && lb.open)
      && !Object.values(paused).some(Boolean) && performance.now() >= resumeAt;

    let pos = 0, last = null;
    const tick = t => {
      if (last !== null && running()) {
        pos += speed * (t - last) / 1000;
        if (pos >= setWidth) pos -= setWidth;
        track.scrollLeft = pos;
      } else {
        pos = track.scrollLeft;                                 // 暂停期间跟随用户的手动滚动
      }
      last = t;
      requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (looping || g.dataset.autoplay !== 'true' || reduceMotion() || !overflowing()) return;
      originals.forEach(li => {
        const c = li.cloneNode(true);
        c.classList.add('clone');
        c.setAttribute('aria-hidden', 'true');                 // 复制品对读屏和键盘隐藏
        $$('img', c).forEach(img => { img.alt = ''; img.loading = 'eager'; });
        track.appendChild(c);
      });
      looping = true;
      g.classList.add('looping');
      pauseBtn.hidden = false;
      measure(); update();
      requestAnimationFrame(tick);
    };

    // 翻页按钮：循环模式下向左越过开头时，先跳到复制品的对应位置再滚动
    [prev, next].forEach(b => b.addEventListener('click', () => {
      const dx = Number(b.dataset.dir) * track.clientWidth * 0.8;
      if (looping && dx < 0 && track.scrollLeft + dx < 0) track.scrollLeft += setWidth;
      holdOff();
      track.scrollBy({ left: dx, behavior: reduceMotion() ? 'auto' : 'smooth' });
      setTimeout(update, 450);
    }));

    pauseBtn.addEventListener('click', () => {
      paused.user = !paused.user;
      pauseBtn.textContent = paused.user ? 'Play' : 'Pause';
      pauseBtn.setAttribute('aria-label', paused.user ? 'Resume photo slideshow' : 'Pause photo slideshow');
    });
    pauseBtn.setAttribute('aria-label', 'Pause photo slideshow');

    g.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') paused.hover = true; });
    g.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') paused.hover = false; });
    g.addEventListener('focusin', () => { paused.focus = !!$(':focus-visible', g); });
    g.addEventListener('focusout', () => { paused.focus = false; });
    track.addEventListener('touchstart', () => { paused.touch = true; }, { passive: true });
    track.addEventListener('touchend', () => { paused.touch = false; holdOff(); }, { passive: true });
    track.addEventListener('wheel', holdOff, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { paused.offscreen = !e.isIntersecting; }).observe(g);
    }

    track.addEventListener('scroll', () => { wrap(); update(); }, { passive: true });
    track.addEventListener('scrollend', update);
    addEventListener('resize', () => { measure(); update(); });

    // 等照片加载完、知道总宽度后，再决定是否需要滚动 / 自动循环
    Promise.all($$('img', track).map(img => img.complete ? null :
      new Promise(r => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); })))
      .then(() => { update(); startLoop(); });
    update();
  });

  /* ---------- 配图 / 照片：点击全屏查看；相册内可用 ← → 切换 ---------- */
  const lightbox = $('.lightbox');
  if (lightbox && lightbox.showModal) {
    const big = $('img', lightbox);
    const caption = $('.lb-caption', lightbox);
    let group = [], index = 0;
    const show = i => {
      index = (i + group.length) % group.length;
      const img = group[index];
      big.src = img.currentSrc || img.src;
      big.alt = img.alt;
      const fc = img.closest('figure') && $('figcaption', img.closest('figure'));
      caption.textContent = fc ? fc.textContent : '';
    };
    // 用事件委托：相册循环时动态加入的复制品也能点击
    document.addEventListener('click', e => {
      const img = e.target.closest('.thumb img, .gallery-track img');
      if (!img) return;
      const track = img.closest('.gallery-track');
      if (track) {
        group = $$('li:not(.clone) img', track);
        const all = $$('img', track);
        show(all.indexOf(img) % group.length);                // 复制品对应回原始照片
      } else {
        group = [img]; show(0);
      }
      lightbox.showModal();
    });
    lightbox.addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('keydown', e => {
      if (group.length < 2) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); show(index - 1); }
    });
  }
})();
