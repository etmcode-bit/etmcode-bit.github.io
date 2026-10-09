/* Embodied Turing Machines — page behaviour. No dependencies. Data: window.ETM (assets/js/data.js). */
(function () {
  'use strict';
  var D = window.ETM;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var noop = function () {};
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(noop); }
  function mss(t) { t = Math.max(0, Math.floor(t)); var m = Math.floor(t / 60), s = t % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function hms(t) {
    t = Math.max(0, Math.floor(t));
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(Math.floor(t / 3600)) + ':' + p(Math.floor(t / 60) % 60) + ':' + p(t % 60);
  }
  function onView(el, fn, opt) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { fn(e.isIntersecting, e); }); }, opt || { threshold: 0.25 });
    io.observe(el); return io;
  }

  /* ---------------------------------------------------------------- nav */
  var nav = $('#nav');
  function navState() { nav.classList.toggle('solid', scrollY > 40); }
  addEventListener('scroll', navState, { passive: true }); navState();
  var links = $$('.nav ul a');
  links.forEach(function (a) {
    var sec = $(a.getAttribute('href'));
    if (sec) onView(sec, function (v) { if (v) links.forEach(function (b) { b.classList.toggle('on', b === a); }); }, { rootMargin: '-45% 0px -50% 0px' });
  });

  /* ---------------------------------------------------------------- reveal */
  var rio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  $$('.rv').forEach(function (el) { rio.observe(el); });

  /* ---------------------------------------------------------------- hero: a wall of episodes behind the title */
  (function () {
    var wall = $('#wall'), G = D.gallery, ROWS = 4, DUR = [92, 110, 98, 116];
    var live = !reduce && innerWidth >= 900 && !(navigator.connection && navigator.connection.saveData);
    var html = '';
    for (var r = 0; r < ROWS; r++) {
      var items = G.filter(function (_, i) { return i % ROWS === r; });
      var pick = (3 * r + 2) % items.length;
      var cells = items.map(function (g, j) {
        var src = 'assets/gallery/' + g.id + '_s';
        return '<div class="wt">' + (live && j === pick
          ? '<video muted loop playsinline preload="auto" poster="' + src + '.jpg" src="' + src + '.mp4"></video>'
          : '<img src="' + src + '.jpg" alt="" width="320" height="240" decoding="async">') + '</div>';
      }).join('');
      html += '<div class="wrow' + (r % 2 ? ' rev' : '') + '"><div class="wtrack" style="--dur:' + DUR[r] + 's">' + cells + cells + '</div></div>';
    }
    wall.innerHTML = html;
    var vids = $$('video', wall);
    vids.forEach(function (v) { v.muted = true; });
    onView($('.hero'), function (v) {
      wall.classList.toggle('paused', !v);
      vids.forEach(function (x) { if (v) play(x); else x.pause(); });
    }, { threshold: 0 });
  })();

  /* ---------------------------------------------------------------- hero: the tape */
  // world-state tokens, as the programs wrote and read them (cover_blocks, stack_bowls episodes)
  var TOK = [['w', 'red : L'], ['w', 'blue : M'], ['w', 'green : R'], ['w', 'L covered'], ['w', 'M covered'], ['w', 'R covered'],
    ['r', 'red : L'], ['w', 'L open'], ['r', 'green : R'], ['w', 'R open'], ['r', 'blue : M'], ['w', 'M open'],
    ['w', '3 bowls'], ['w', 'B: best 4'], ['w', 'B #1 yaw 60 ✗'], ['r', 'B: best 4'], ['w', 'B #2 yaw 75 ✓'], ['w', 'B stacked'], ['w', 'model calls : 0']];
  var track = $('#tapeTrack'), head = $('#tapeHead'), rule = $('#tapeRule'), tapeBox = $('#tape');
  var cells = [], cw = 162, hIdx = 0, x0 = 0, ti = 0;
  function tapeLayout() {
    track.innerHTML = ''; cells = [];
    var W = tapeBox.clientWidth;
    var probe = document.createElement('div'); probe.className = 'cell'; track.appendChild(probe);
    var st = getComputedStyle(probe); cw = probe.offsetWidth + parseFloat(st.marginRight || 0); track.removeChild(probe);
    var n = Math.ceil(W / cw) + 4;
    hIdx = Math.floor(n / 2);
    x0 = W / 2 - (hIdx * cw + (cw - 6) / 2);
    for (var i = 0; i < n; i++) {
      var c = document.createElement('div'); c.className = 'cell';
      var k = i - hIdx; // past cells hold earlier tokens
      if (k <= 0) { var tk = TOK[(ti + k + TOK.length * 4) % TOK.length]; c.textContent = tk[1]; if (tk[0] === 'r') c.classList.add('rd'); } else { c.className = 'cell blank'; c.textContent = '·'; }
      track.appendChild(c); cells.push(c);
    }
    track.style.transition = 'none'; track.style.transform = 'translate3d(' + x0 + 'px,0,0)';
  }
  function tapeTick() {
    track.style.transition = 'transform .5s cubic-bezier(.6,0,.2,1)';
    track.style.transform = 'translate3d(' + (x0 - cw) + 'px,0,0)';
    setTimeout(function () {
      var first = cells.shift(); track.appendChild(first); cells.push(first);
      first.className = 'cell blank'; first.textContent = '·';
      track.style.transition = 'none'; track.style.transform = 'translate3d(' + x0 + 'px,0,0)';
      ti = (ti + 1) % TOK.length;
      var tk = TOK[ti], c = cells[hIdx];
      c.textContent = tk[1]; c.className = 'cell' + (tk[0] === 'r' ? ' rd' : '');
      void c.offsetWidth; c.classList.add('stamp');
      rule.textContent = tk[0] === 'r' ? 'read' : 'write';
      head.classList.remove('hit'); void head.offsetWidth; head.classList.add('hit');
      setTimeout(function () { c.classList.remove('stamp'); }, 900);
    }, 520);
  }
  tapeLayout();
  if (window.ResizeObserver) { var tW = tapeBox.clientWidth; new ResizeObserver(function () { if (tapeBox.clientWidth !== tW) { tW = tapeBox.clientWidth; tapeLayout(); } }).observe(tapeBox); }
  var tapeTimer = null;
  if (!reduce) {
    onView($('.hero'), function (v) {
      if (v && !tapeTimer) tapeTimer = setInterval(tapeTick, 1000);
      if (!v && tapeTimer) { clearInterval(tapeTimer); tapeTimer = null; }
    }, { threshold: 0 });
  }

  /* ---------------------------------------------------------------- film */
  // the master, cut into segments without re-encoding: Safari plays the playlist itself, other browsers through hls.js
  var film = $('#filmVid'), cover = $('#filmCover'), filmLoaded = false;
  function loadFilm(done) {
    var src = film.dataset.hls;
    if (film.canPlayType('application/vnd.apple.mpegurl')) { film.src = src; return done(); }
    var s = document.createElement('script');
    s.src = 'assets/js/vendor/hls.light.min.js';
    s.onload = function () {
      if (window.Hls && Hls.isSupported()) { var h = new Hls({ maxBufferLength: 30 }); h.loadSource(src); h.attachMedia(film); }
      done();
    };
    document.head.appendChild(s);
  }
  function startFilm() {
    cover.hidden = true; film.hidden = false;
    if (filmLoaded) return play(film);
    filmLoaded = true; loadFilm(function () { play(film); });
  }
  cover.addEventListener('click', startFilm);

  /* ---------------------------------------------------------------- code + episode */
  // moments the player stops on: the lines that ran, what they returned, which tape cell was read
  var MOMENTS = {
    cover: {
      0: { ms: 1900, seq: [[0], [1], [2], [3]], badge: [3, 'write tape', 'ok'] },
      190: { ms: 1300, lines: [6, 7], cls: { 7: 'read' }, badge: [7, 'red → L', 'rd'], read: 0 },
      256: { ms: 1300, lines: [6, 7], cls: { 7: 'read' }, badge: [7, 'green → R', 'rd'], read: 2 },
      311: { ms: 1300, lines: [6, 7], cls: { 7: 'read' }, badge: [7, 'blue → M', 'rd'], read: 1 }
    },
    retry: {
      152: { ms: 1100, lines: [1, 2], badge: [2, '13 → best 4', 'ok'] },
      204: { ms: 1900, lines: [1, 3, 5], cls: { 5: 'fail' }, badge: [5, 'False', 'bad'] },
      205: { ms: 1800, lines: [1, 3, 7], cls: { 7: 'back' }, badge: [7, '↺ pre-grasp', 'bk'], read: 4 },
      206: { ms: 1200, lines: [1, 3, 4], badge: [3, 'g: yaw 75°', 'ok'] },
      237: { ms: 1400, lines: [1, 3, 5, 6], badge: [5, 'True', 'ok'] }
    }
  };
  var RING = { 'try': 'attempt 1 · yaw 60°', fail: '✗ failed', back: '↺ backtrack', retry: 'attempt 2 · yaw 75°', ok: '✓ held' };
  function hlPy(line) {
    var h = esc(line), cm = '';
    var i = h.indexOf('#');
    if (i >= 0) { cm = '<span class="tok-cm">' + h.slice(i) + '</span>'; h = h.slice(0, i); }
    h = h.replace(/\b(for|in|if|def|return|break|while|not|and|or)\b/g, '<span class="tok-kw">$1</span>')
      .replace(/\b([a-z_][a-z0-9_]*)(?=\()/g, '<span class="tok-fn">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="tok-nm">$1</span>');
    return h + cm;
  }
  function at(runs, s) { var v = runs[0][1]; for (var i = 0; i < runs.length && runs[i][0] <= s; i++) v = runs[i][1]; return v; }

  (function () {
    var vid = $('#caseVid'), codeEl = $('#caseCode'), regEl = $('#caseReg'), tapeEl = $('#caseTape'), capEl = $('#caseCap'), arEl = $('#caseAR');
    var stepHud = $('#caseStepHud'), stepNo = $('#caseStepNo'), range = $('#caseRange'), fill = $('#caseFill'), segsEl = $('#caseSegs');
    var banner = $('#caseBanner'), regStep = $('#regStep'), pp = $('#casePP'), ppi = $('#casePPi');
    var C = null, M = {}, lines = [], firstRun = [], tapeCells = [], cellsBox = null, focus = -1, actKey = '', last = -1, playing = true, visible = false;
    var hold = null, holdT0 = 0, lastShown = {}, endT = 0, raf = 0, slots = [], ring = null;
    function setPP() {
      ppi.innerHTML = playing ? '<rect x="2" y="1" width="3.5" height="12"/><rect x="8.5" y="1" width="3.5" height="12"/>' : '<path d="M3 1.5v11l9-5.5z"/>';
      pp.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    }
    function load(c) {
      C = c; M = MOMENTS[c.key] || {}; last = -1; hold = null; endT = 0; lastShown = {};
      $('#caseFile').textContent = c.file;
      $('#codeKicker').textContent = c.kicker + '.';
      codeEl.innerHTML = c.code.map(function (l, i) {
        return '<div class="ln dim" data-i="' + i + '"><span class="n">' + (i + 1) + '</span><span class="tx">' + (l ? hlPy(l) : ' ') + '</span></div>';
      }).join('');
      lines = $$('.ln', codeEl);
      firstRun = c.code.map(function () { return Infinity; });
      c.lines.forEach(function (r) { r[1].forEach(function (i) { firstRun[i] = Math.min(firstRun[i], r[0]); }); });
      Object.keys(M).forEach(function (k) { var m = M[k]; (m.lines || []).concat(m.seq ? [].concat.apply([], m.seq) : []).forEach(function (i) { firstRun[i] = Math.min(firstRun[i], +k); }); });
      var nCells = 1 + Math.max.apply(null, c.tape.map(function (t) { return t[2]; }));
      tapeEl.innerHTML = '<div class="lab">TAPE<b>state</b></div><div class="cells">' + Array(nCells + 1).join('<div class="c"></div>') + '</div>';
      tapeCells = $$('.c', tapeEl); cellsBox = $('.cells', tapeEl); focus = -1; cellsBox.scrollLeft = 0; codeEl.scrollTop = 0; actKey = '';
      // marks on the episode: what the program knows about each slot, or where it is grasping
      arEl.innerHTML = (c.slots || []).map(function (sl) {
        return '<div class="slot" style="left:' + sl.x + '%;top:' + sl.y + '%"><span class="tg"><i class="' + sl.c + '"></i>' + sl.c + '</span><span class="k">' + sl.k + '</span></div>';
      }).join('') + (c.ring ? '<div class="ring" style="left:' + c.ring.x + '%;top:' + c.ring.y + '%"><i></i><span class="tag">RETRY</span><span class="lab"></span></div>' : '');
      slots = $$('.slot', arEl); ring = $('.ring', arEl);
      segsEl.innerHTML = (c.segs || []).map(function (g) {
        return '<i class="' + g[2] + '" style="left:' + (100 * g[0] / c.n) + '%;width:' + (100 * (g[1] - g[0]) / c.n) + '%"></i>';
      }).join('');
      range.max = c.n;
      pending = null; vid.poster = c.poster; vid.src = c.video; vid.load();
      render(0, true);
      if (visible && playing) begin();
    }
    // a seek made before the clip has metadata is applied once it has
    var pending = null;
    vid.addEventListener('loadedmetadata', function () { if (pending !== null) { vid.currentTime = pending; pending = null; } });
    function seekTo(t) { if (vid.readyState >= 1) vid.currentTime = t; else pending = t; }
    function begin() {
      if (M[0] && last <= 0) startHold(0);
      else play(vid);
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    }
    function startHold(s) {
      hold = s; holdT0 = performance.now(); vid.pause();
      var t = (s + 0.5) / C.fps; if (Math.abs(vid.currentTime - t) > 0.5 / C.fps) seekTo(t);
    }
    function loop() {
      raf = requestAnimationFrame(loop);
      if (!C) return;
      var now = performance.now();
      if (hold !== null) {
        var m = M[hold];
        render(hold, false, now - holdT0);
        if (!playing) { holdT0 = now - Math.min(now - holdT0, m.ms - 1); return; }
        if (now - holdT0 >= m.ms) {
          var s0 = hold; hold = null; lastShown.hold = s0;
          if (s0 >= C.n) return;
          play(vid);
        }
        return;
      }
      if (!playing) return;
      var s = Math.min(C.n, Math.floor(vid.currentTime * C.fps + 1e-4));
      // crossing a moment: freeze on it
      for (var k in M) {
        k = +k;
        if (k > 0 && last < k && s >= k && lastShown.hold !== k) { seekTo((k + 0.5) / C.fps); startHold(k); render(k); return; }
      }
      render(s);
      if (vid.ended || s >= C.n) {
        if (!endT) endT = now;
        if (now - endT > 2600) { endT = 0; lastShown = {}; last = -1; seekTo(0); render(0, true); if (M[0]) startHold(0); else play(vid); }
      }
    }
    function render(s, force, holdMs) {
      if (s === last && !force && holdMs == null) return;
      var m = hold !== null ? M[hold] : null;
      // code lines
      var act = at(C.lines, s), cls = {};
      if (m) {
        if (m.seq) { var k = Math.min(m.seq.length - 1, Math.floor((holdMs || 0) / (m.ms / (m.seq.length + 0.6)))); act = m.seq[k]; for (var j = 0; j < k; j++) m.seq[j].forEach(function (i) { cls[i] = 'ranx'; }); }
        else act = m.lines;
        if (m.cls) Object.keys(m.cls).forEach(function (i) { cls[i] = m.cls[i]; });
      }
      lines.forEach(function (el, i) {
        var on = act.indexOf(i) >= 0, ran = firstRun[i] <= s || cls[i] === 'ranx';
        el.classList.toggle('on', on && !cls[i]);
        el.classList.toggle('read', cls[i] === 'read');
        el.classList.toggle('fail', cls[i] === 'fail');
        el.classList.toggle('back', cls[i] === 'back');
        el.classList.toggle('ran', ran);
        el.classList.toggle('dim', !ran && !on && !(m && m.seq && act.indexOf(i) >= 0));
        var b = $('.badge', el);
        var want = m && m.badge && m.badge[0] === i && (!m.seq || (holdMs || 0) > m.ms * 0.55);
        if (want && !b) { b = document.createElement('span'); b.className = 'badge ' + m.badge[2]; b.textContent = m.badge[1]; el.appendChild(b); }
        if (!want && b) b.remove();
      });
      // keep the running line in view when the code scrolls inside its block
      var key = act.join(',');
      if (key !== actKey && codeEl.scrollHeight > codeEl.clientHeight + 2) {
        var ln = lines[act[act.length - 1]], r = ln.getBoundingClientRect(), pr = codeEl.getBoundingClientRect();
        if (r.top < pr.top + 8 || r.bottom > pr.bottom - 8) codeEl.scrollTop += r.top - pr.top - (pr.height - r.height) / 2;
      }
      actKey = key;
      // tape: what the program wrote so far; the cell it reads lights up
      var shown = tapeCells.map(function () { return null; }), fresh = {}, readCell = m && m.read != null ? m.read : -1;
      C.tape.forEach(function (t) {
        if (t[1] !== 'w') return;
        var on = t[0] === 0 && m && m.seq ? (holdMs || 0) > m.ms * (0.3 + 0.15 * t[2]) : t[0] <= s;
        if (on) { shown[t[2]] = t[3]; if (s - t[0] < 10 && s >= t[0]) fresh[t[2]] = 1; }
      });
      tapeCells.forEach(function (el, i) {
        var txt = shown[i];
        el.textContent = txt || '';
        el.classList.toggle('w', !!txt);
        el.classList.toggle('r', i === readCell);
        el.classList.toggle('x', !!txt && txt.indexOf('✗') >= 0);
        if (fresh[i] && !el.dataset.stamped) { el.classList.remove('new'); void el.offsetWidth; el.classList.add('new'); el.dataset.stamped = '1'; }
        if (!fresh[i]) { delete el.dataset.stamped; el.classList.remove('new'); }
      });
      // scroll the tape a whole cell at a time, so no cell is ever cut at the left edge
      var f = readCell >= 0 ? readCell : shown.reduce(function (a, v, i) { return v ? i : a; }, 0);
      if (f !== focus && tapeCells.length > 1) {
        var pitch = tapeCells[1].offsetLeft - tapeCells[0].offsetLeft, fit = Math.max(1, Math.floor((cellsBox.clientWidth + 5) / pitch));
        var first = Math.max(0, Math.min(f - fit + 2, tapeCells.length - fit));
        cellsBox.scrollTo({ left: first * pitch, behavior: reduce ? 'auto' : 'smooth' });
      }
      focus = f;
      // recorded state
      var reg = {}, order = [], changed = {};
      C.reg.forEach(function (r) { if (r[0] <= s) { if (!(r[1] in reg)) order.push(r[1]); reg[r[1]] = r[2]; if (r[0] === s || (s - r[0] >= 0 && s - r[0] < 3)) changed[r[1]] = 1; } });
      var html = order.slice(-5).map(function (k) { return '<div class="kv' + (changed[k] ? ' fresh' : '') + '"><span>' + esc(k) + '</span><span>' + esc(reg[k]) + '</span></div>'; }).join('');
      if (html !== regEl.dataset.h) { regEl.innerHTML = html || '<div class="kv"><span>—</span><span>nothing recorded yet</span></div>'; regEl.dataset.h = html; }
      regStep.textContent = 'step ' + s;
      // marks on the video
      slots.forEach(function (el, i) {
        var sl = C.slots[i], st = s < sl.cover ? 'seen' : s < sl.read ? 'hidden' : s < sl.open ? 'read' : 'open';
        if (el.dataset.st !== st) { el.className = 'slot ' + st; el.dataset.st = st; }
      });
      if (ring) {
        var rs = at(C.ring.runs, s);
        if (ring.dataset.st !== rs) { ring.className = 'ring' + (rs ? ' on ' + rs : ''); $('.lab', ring).textContent = RING[rs] || ''; ring.dataset.st = rs; }
      }
      // hud
      var cap = at(C.cap, s), capCls = '';
      if (m && m.badge && C.key === 'cover' && hold > 0) cap = 'read the state: ' + m.badge[1];
      if (C.ring) { var r2 = at(C.ring.runs, s); capCls = r2 === 'fail' ? 'bad' : r2 === 'back' ? 'back' : r2 === 'ok' ? 'ok' : ''; }
      if (capEl.textContent !== cap) capEl.textContent = cap;
      capEl.className = 'chip cap' + (capCls ? ' ' + capCls : '');
      var pad = String(s); while (pad.length < 3) pad = '0' + pad;
      stepHud.textContent = 'step ' + pad + ' / ' + C.n;
      stepNo.textContent = s + ' / ' + C.n;
      range.value = s; fill.style.width = (100 * s / C.n) + '%';
      banner.classList.toggle('on', C.key === 'cover' && ((s >= 185 && s < 243) || !!(m && m.read != null)));
      last = s;
    }
    range.addEventListener('input', function () {
      if (!C) return;
      hold = null; var s = +range.value; vid.pause(); playing = false; setPP();
      seekTo((s + 0.5) / C.fps); lastShown = {}; for (var k in M) if (+k <= s) lastShown.hold = +k;
      render(s, true);
    });
    pp.addEventListener('click', function () {
      playing = !playing; setPP();
      if (playing) { if (hold === null) { if (last >= C.n) { seekTo(0); last = -1; lastShown = {}; } begin(); } }
      else vid.pause();
    });
    var tabs = $('#caseTabs');
    tabs.innerHTML = D.cases.map(function (c, i) {
      return '<button role="tab" type="button" aria-selected="' + (i === 0) + '" data-i="' + i + '">' + esc(c.tab) + '</button>';
    }).join('');
    $$('button', tabs).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', tabs).forEach(function (x) { x.setAttribute('aria-selected', x === b); });
        playing = true; setPP(); load(D.cases[+b.dataset.i]);
      });
    });
    onView($('#caseP'), function (v) {
      visible = v;
      if (v && playing) begin(); else { vid.pause(); cancelAnimationFrame(raf); }
    }, { threshold: 0.3 });
    load(D.cases[0]);
  })();

  /* ---------------------------------------------------------------- no model in the loop: that part of the film */
  (function () {
    var v = $('#nmVid'), visible = false, hold = 0;
    v.muted = true;
    if (reduce) { v.controls = true; return; }
    // the last frame has the final times: hold it, then play again
    v.addEventListener('ended', function () { hold = setTimeout(function () { hold = 0; if (visible) play(v); }, 3500); });
    onView(v, function (on) { visible = on; if (!on) v.pause(); else if (!hold) play(v); }, { threshold: 0.35 });
  })();

  /* ---------------------------------------------------------------- gallery */
  (function () {
    var G = D.gallery, list = G, live = 0, MAXLIVE = 18;
    var DIMS = ['Memory', 'Precision', 'Open', 'Generalization', 'Long-Horizon'];
    var F = [['All', function () { return true; }]].concat(DIMS.map(function (d) { return [d.replace('Long-Horizon', 'Long-horizon'), function (g) { return g.dim === d; }]; }))
      .concat([['Randomized rooms', function (g) { return g.rand; }]]);
    var fBox = $('#filters');
    fBox.innerHTML = F.map(function (f, i) { return '<button type="button" aria-pressed="' + (i === 0) + '" data-i="' + i + '">' + f[0] + '<i>' + G.filter(f[1]).length + '</i></button>'; }).join('');
    var marq = $('#marq');
    var tio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var t = e.target, v = $('video', t);
        if (e.isIntersecting && !v && live < MAXLIVE && !reduce) {
          v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true; v.preload = 'auto';
          v.setAttribute('muted', ''); v.src = 'assets/gallery/' + t.dataset.id + '_s.mp4';
          t.insertBefore(v, t.firstChild.nextSibling); live++;
          play(v);
        } else if (!e.isIntersecting && v) { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); live--; }
      });
    }, { rootMargin: '60px 0px' });
    function tile(g, k) {
      return '<button class="tile" type="button" data-id="' + g.id + '" data-k="' + k + '" aria-label="' + esc(g.title) + (g.rand ? ', randomized room' : '') + '">' +
        '<img src="assets/gallery/' + g.id + '_s.jpg" alt="" loading="lazy" width="320" height="240">' +
        '<span class="meta"><b>' + esc(g.title) + '</b><span>' + g.sr.toFixed(g.sr % 1 ? 1 : 0) + '%</span></span></button>';
    }
    function build() {
      tio.disconnect(); live = 0;
      var rows = list.length > 14 ? 3 : list.length > 6 ? 2 : 1, html = '';
      for (var r = 0; r < rows; r++) {
        var items = list.filter(function (_, i) { return i % rows === r; });
        var base = items.slice();
        while (items.length < 9) items = items.concat(base);
        var cells = items.map(function (g) { return tile(g, list.indexOf(g)); }).join('');
        var dur = Math.max(40, items.length * 5.5);
        html += '<div class="mrow' + (r % 2 ? ' rev' : '') + '"><div class="mtrack" style="--dur:' + dur + 's">' + cells + cells.replace(/<button class="tile"/g, '<button class="tile" tabindex="-1" aria-hidden="true"') + '</div></div>';
      }
      marq.innerHTML = html;
      $$('.tile', marq).forEach(function (t) { tio.observe(t); t.addEventListener('click', function () { openLB(+t.dataset.k); }); });
    }
    $$('button', fBox).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', fBox).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        list = G.filter(F[+b.dataset.i][1]); build();
      });
    });
    build();
    // lightbox
    var lb = $('#lb'), lv = $('#lbVid'), li = 0, opener = null;
    function show(k) {
      li = (k + list.length) % list.length; var g = list[li];
      lv.src = 'assets/gallery/' + g.id + '.mp4'; lv.poster = 'assets/gallery/' + g.id + '.jpg';
      play(lv);
      $('#lbKind').textContent = g.dim + ' · ' + (g.rand ? 'randomized room' : 'standard scene') + ' · ' + g.sec.toFixed(1) + ' s';
      $('#lbTitle').textContent = g.title;
      $('#lbIns').textContent = '“' + g.ins + '”';
      $('#lbSr').innerHTML = g.sr.toFixed(g.sr % 1 ? 1 : 0) + '%<small>task success rate, official evaluation</small>';
    }
    function openLB(k) { opener = document.activeElement; lb.hidden = false; show(k); $('#lbClose').focus(); }
    function closeLB() { lb.hidden = true; lv.pause(); lv.removeAttribute('src'); lv.load(); if (opener) opener.focus(); }
    $('#lbClose').addEventListener('click', closeLB);
    $('#lbPrev').addEventListener('click', function () { show(li - 1); });
    $('#lbNext').addEventListener('click', function () { show(li + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLB(); });
    addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLB();
      if (e.key === 'ArrowRight') show(li + 1);
      if (e.key === 'ArrowLeft') show(li - 1);
    });
  })();

  /* ---------------------------------------------------------------- results */
  (function () {
    var digits = $('#digits'), txt = '70.24%';
    digits.innerHTML = '<div class="hd" id="dhd"></div>' + txt.split('').map(function (ch) {
      return '<div class="d' + (ch === '.' ? ' p' : '') + '">' + (ch === '.' || ch === '%' ? ch : '0') + '</div>';
    }).join('');
    var ds = $$('.d', digits), hd = $('#dhd'), done = false;
    function run() {
      if (done) return; done = true;
      var k = 0;
      (function next() {
        if (k >= txt.length) { ds.forEach(function (d) { d.classList.remove('hot'); }); hd.style.opacity = '0'; return; }
        var d = ds[k], ch = txt[k];
        hd.style.transform = 'translateX(' + (d.offsetLeft + (d.offsetWidth - hd.offsetWidth) / 2) + 'px)';
        ds.forEach(function (x) { x.classList.toggle('hot', x === d); });
        if (/\d/.test(ch)) {
          var n = 0, target = +ch, spins = reduce ? 0 : 6;
          (function spin() {
            if (n < spins) { d.textContent = String((target + n * 3 + 1) % 10); n++; setTimeout(spin, 45); }
            else { d.textContent = ch; k++; setTimeout(next, reduce ? 0 : 160); }
          })();
        } else { k++; setTimeout(next, reduce ? 0 : 120); }
      })();
    }
    onView($('#score'), function (v) { if (v) run(); }, { threshold: 0.5 });
    var dims = $('#dims');
    dims.innerHTML = D.dims.map(function (d) {
      return '<div class="dm"><span>' + esc(d[0]) + '</span><b>' + d[2].toFixed(1) + '<small>%</small></b><div class="tr"><i data-w="' + d[2] + '"></i></div></div>';
    }).join('');
    onView(dims, function (v) { if (v) $$('i[data-w]', dims).forEach(function (i) { i.style.width = i.dataset.w + '%'; }); }, { threshold: 0.3 });
  })();

  /* ---------------------------------------------------------------- why: new tasks, measured */
  (function () {
    var svg = $('#trend'), S = D.newtask.steps, X0 = 6, X1 = 294, Y0 = 88, Y1 = 14, TOP = 50;
    var px = function (h) { return (X0 + (X1 - X0) * h / 15).toFixed(1); };
    var py = function (v) { return (Y0 - (Y0 - Y1) * v / TOP).toFixed(1); };
    var d = 'M' + px(0) + ' ' + py(0);
    S.forEach(function (p, i) { if (i) d += 'H' + px(p[0]) + 'V' + py(p[1]); });
    var top = S[S.length - 1][1];
    svg.innerHTML =
      '<line class="gr" x1="' + X0 + '" x2="' + X1 + '" y1="' + py(25) + '" y2="' + py(25) + '"/>' +
      '<line class="gr" x1="' + X0 + '" x2="' + X1 + '" y1="' + py(50) + '" y2="' + py(50) + '"/>' +
      '<line class="ax" x1="' + X0 + '" x2="' + X1 + '" y1="' + Y0 + '" y2="' + Y0 + '"/>' +
      '<path class="ar2" d="' + d + 'V' + Y0 + 'H' + X0 + 'Z"/>' +
      '<path class="cv" d="' + d + '"/>' +
      '<text x="' + X0 + '" y="' + (Y0 + 17) + '">0 h</text>' +
      '<text x="' + X1 + '" y="' + (Y0 + 17) + '" text-anchor="end">15 h</text>' +
      '<text class="v" x="' + (X1 - 2) + '" y="' + (+py(top) - 8) + '" text-anchor="end">' + Math.round(top) + '%</text>';
    onView(svg, function (v) { if (v) svg.classList.add('in'); }, { threshold: 0.5 });
  })();

  /* ---------------------------------------------------------------- rsi: branches in parallel */
  (function () {
    var tree = $('#tree'), box = $('#branches'), svg = $('#treeLinks'), root = $('#treeRoot');
    var B = [['b2_rim_leaned45_near', 'rim, leaned', '45°, deep grip'], ['b3_rim_vertical_far', 'rim, far side', 'upright'],
      ['b1_rim_vertical_near', 'rim, upright', 'opposite the handle', 1], ['b4_rim_next_to_handle', 'rim, by handle', 'upright'],
      ['b8_rim_shallow', 'rim, shallow', 'tips at the rim'], ['b5_handle', 'handle', 'around the bar'],
      ['b6_side_body', 'side', 'around the body'], ['b7_top_body', 'top', 'across the body']];
    box.innerHTML = B.map(function (b) {
      return '<div class="br' + (b[3] ? ' kept' : '') + '"><video muted loop playsinline preload="none" poster="assets/rsi/' + b[0] + '.jpg" src="assets/rsi/' + b[0] + '.mp4"></video>' +
        '<span class="pg"></span><span class="kt">KEPT</span><div class="nm">' + esc(b[1]) + '<small>' + esc(b[2]) + '</small></div></div>';
    }).join('');
    var brs = $$('.br', box), decs = $$('.dec', tree), vids = $$('video', tree);
    var KEEP = { 2: 1, 3: 2 };
    decs.forEach(function (d) { $$('i', d)[KEEP[d.dataset.d]].classList.add('kept'); });
    vids.forEach(function (v) { v.muted = true; });
    function c(el, side) {
      var r = el.getBoundingClientRect(), t = tree.getBoundingClientRect();
      return [r.left - t.left + r.width / 2, side ? r.bottom - t.top : r.top - t.top];
    }
    function curve(a, b) { var m = (a[1] + b[1]) / 2; return 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'C' + a[0].toFixed(1) + ' ' + m.toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + m.toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1); }
    function layout() {
      var r0 = c(root, 1), html = '';
      brs.forEach(function (b) { html += '<path pathLength="1" class="l1' + (b.classList.contains('kept') ? ' k' : '') + '" d="' + curve(r0, c(b)) + '"/>'; });
      var kb = c($('.br.kept', box), 1);
      var n2 = $$('.dec[data-d="2"] i', tree), n3 = $$('.dec[data-d="3"] i', tree), k2 = c(n2[KEEP[2]], 1);
      n2.forEach(function (n, j) { html += '<path pathLength="1" class="sub d2' + (j === KEEP[2] ? ' k' : '') + '" d="' + curve(kb, c(n)) + '"/>'; });
      n3.forEach(function (n, j) { html += '<path pathLength="1" class="sub d3' + (j === KEEP[3] ? ' k' : '') + '" d="' + curve(k2, c(n)) + '"/>'; });
      svg.innerHTML = html;
      svg.setAttribute('viewBox', '0 0 ' + tree.clientWidth + ' ' + tree.clientHeight);
      // a resize mid-cycle keeps the cycle's state
      if (tree.classList.contains('s2')) $$('path.l1.k', svg).forEach(function (p) { p.classList.add('kept'); });
      decs.forEach(function (el) {
        var d = el.dataset.d;
        if (/run|done/.test(el.className)) $$('path.d' + d, svg).forEach(function (p) { p.classList.add('on'); });
        if (/done/.test(el.className)) $$('path.d' + d + '.k', svg).forEach(function (p) { p.classList.add('kept'); });
      });
    }
    layout();
    if (window.ResizeObserver) new ResizeObserver(layout).observe(tree);
    // one cycle: all grasps run at once, keep one; then carry; then hang
    var STEPS = [[0, 's0'], [400, 's1'], [3000, 's2'], [3800, 'd2run'], [5600, 'd2'], [6200, 'd3run'], [8000, 'd3'], [12500, 'end']];
    var timers = [], on = false;
    function set(k) {
      if (k === 's0') {
        tree.classList.remove('s1', 's2');
        decs.forEach(function (d) { d.className = 'dec'; });
        $$('path', svg).forEach(function (p) { p.classList.remove('kept', 'on'); });
        return;
      }
      if (k === 's1') { tree.classList.add('s1'); return; }
      if (k === 's2') { tree.classList.add('s2'); $$('path.l1.k', svg).forEach(function (p) { p.classList.add('kept'); }); return; }
      var d = k.charAt(1), el = $('.dec[data-d="' + d + '"]', tree);
      if (/run$/.test(k)) { el.className = 'dec run'; $$('path.d' + d, svg).forEach(function (p) { p.classList.add('on'); }); }
      else { el.className = 'dec done'; $$('path.d' + d + '.k', svg).forEach(function (p) { p.classList.add('kept'); }); }
    }
    function cycle() {
      timers.forEach(clearTimeout); timers = [];
      STEPS.forEach(function (s) { timers.push(setTimeout(function () { if (s[1] === 'end') cycle(); else set(s[1]); }, s[0])); });
    }
    if (reduce) { tree.classList.add('s1', 's2'); ['d2', 'd3'].forEach(set); return; }
    onView(tree, function (v) {
      if (v && !on) { on = true; vids.forEach(play); cycle(); }
      if (!v && on) { on = false; timers.forEach(clearTimeout); timers = []; vids.forEach(function (x) { x.pause(); }); set('s0'); }
    }, { threshold: 0.25 });
  })();

  /* ---------------------------------------------------------------- bibtex */
  $('#copyBib').addEventListener('click', function (e) {
    var b = e.currentTarget, text = $('#bibtex').textContent;
    var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); };
    // where the clipboard is refused, select the entry so it can be copied by hand
    var select = function () { var r = document.createRange(); r.selectNodeContents($('#bibtex')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, select);
    else select();
  });
})();
