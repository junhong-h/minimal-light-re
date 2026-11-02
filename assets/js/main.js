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

  /* ---------- 配图 / 照片：点击全屏查看 ---------- */
  const lightbox = $('.lightbox');
  if (lightbox && lightbox.showModal) {
    const big = $('img', lightbox);
    $$('.thumb img, .photos img').forEach(img => img.addEventListener('click', () => {
      big.src = img.currentSrc || img.src;
      big.alt = img.alt;
      lightbox.showModal();
    }));
    lightbox.addEventListener('click', () => lightbox.close());
  }
})();
