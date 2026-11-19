/* Leonida Trophy Atlas — tracker logic.
   Loads data/trophies.json, renders the checklist, and keeps progress in
   localStorage. No network at run time: the only fetch is the app's own
   data file, served from the same folder. */

(function () {
  'use strict';

  var STORE_KEY = 'leonida-trophy-atlas-v1';
  var POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
  var KIND_LABELS = {
    all: 'All', story: 'Story', missable: 'Missable',
    collectibles: 'Collectibles', activities: 'Activities', online: 'Online'
  };
  var ROADMAP_LABELS = {
    1: 'Step 1 — play the story',
    2: 'Step 2 — the 100% checklist',
    3: 'Step 3 — strangers & cleanup'
  };

  var listEl = document.getElementById('list');
  var searchEl = document.getElementById('search');
  var spoilerEl = document.getElementById('spoilerToggle');
  var tabsEl = document.getElementById('tabs');
  var pillEl = document.getElementById('tabPill');
  var metaEl = document.getElementById('listMeta');
  var toastEl = document.getElementById('toast');

  var trophies = [];
  var earned = new Set();
  var kind = 'all';
  var query = '';
  var spoiler = false;
  var openId = null;
  var toastTimer = null;

  /* -- state ---------------------------------------------------------- */

  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (Array.isArray(saved.earned)) earned = new Set(saved.earned.filter(isKnownId));
      if (typeof saved.spoiler === 'boolean') spoiler = saved.spoiler;
      if (typeof saved.kind === 'string' && KIND_LABELS[saved.kind]) kind = saved.kind;
    } catch (err) { /* a broken save is ignored; the list still renders */ }
  }

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        earned: Array.from(earned).sort(function (a, b) { return a - b; }),
        spoiler: spoiler,
        kind: kind
      }));
    } catch (err) { /* storage full or blocked: the page still works */ }
  }

  function isKnownId(id) {
    return trophies.some(function (t) { return t.id === id; });
  }

  /* -- screenshot presets: ?open=17&check=1,2,5&spoiler=off&kind=story -- */
  function applyShotParams() {
    var params = new URLSearchParams(window.location.search);
    // ?view=list hides the intro sections so the checklist starts at the top.
    if (params.get('view') === 'list') document.body.classList.add('view-list');
    if (params.has('spoiler')) spoiler = params.get('spoiler') === 'on';
    if (params.has('kind') && KIND_LABELS[params.get('kind')]) kind = params.get('kind');
    if (params.has('check')) {
      params.get('check').split(',').forEach(function (part) {
        var id = Number(part);
        if (isKnownId(id)) earned.add(id);
      });
    }
    if (params.has('open')) {
      var id = Number(params.get('open'));
      if (isKnownId(id)) openId = id;
    }
    if (params.has('q')) {
      query = params.get('q');
      searchEl.value = query;
    }
  }

  /* -- rendering ------------------------------------------------------ */

  function gradePoints(t) { return POINTS[t.grade] || 0; }

  function totalPoints() {
    return trophies.reduce(function (sum, t) { return sum + gradePoints(t); }, 0);
  }

  function earnedPoints() {
    var sum = 0;
    earned.forEach(function (id) {
      var t = trophies.find(function (x) { return x.id === id; });
      if (t) sum += gradePoints(t);
    });
    return sum;
  }

  function isHiddenFromSpoiler(t) {
    return spoiler && t.kind === 'story' && !earned.has(t.id);
  }

  function matches(t) {
    if (kind !== 'all' && t.kind !== kind) return false;
    if (!query) return true;
    var hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
    return hay.indexOf(query.toLowerCase()) !== -1;
  }

  function pillFor(t, label, cls) {
    var span = document.createElement('span');
    span.className = 'pill' + (cls ? ' ' + cls : '');
    span.textContent = label;
    return span;
  }

  function sourceList(sources) {
    var ul = document.createElement('ul');
    sources.forEach(function (s) {
      var li = document.createElement('li');
      if (s.url) {
        var a = document.createElement('a');
        a.href = s.url;
        a.textContent = s.name;
        a.rel = 'noopener';
        li.appendChild(a);
      } else {
        li.textContent = s.name;
      }
      ul.appendChild(li);
    });
    return ul;
  }

  function trophyCard(t) {
    var card = document.createElement('article');
    card.className = 'trophy' + (earned.has(t.id) ? ' is-earned' : '') + (openId === t.id ? ' is-open' : '');
    card.dataset.id = String(t.id);

    var head = document.createElement('div');
    head.className = 'trophy-head';

    var check = document.createElement('button');
    check.type = 'button';
    check.className = 'check';
    check.setAttribute('aria-pressed', earned.has(t.id) ? 'true' : 'false');
    check.setAttribute('aria-label', (earned.has(t.id) ? 'Mark as not earned: ' : 'Mark as earned: ') + t.name);
    check.addEventListener('click', function () { toggleEarned(t.id); });
    head.appendChild(check);

    var title = document.createElement('div');
    title.className = 'trophy-title';
    var name = document.createElement('p');
    name.className = 'trophy-name';
    var desc = document.createElement('p');
    desc.className = 'trophy-desc';
    if (isHiddenFromSpoiler(t)) {
      name.textContent = 'Hidden trophy';
      desc.textContent = 'A story trophy — earn it to reveal its name and description.';
      desc.classList.add('spoiler-hidden');
    } else {
      name.textContent = t.name;
      desc.textContent = t.description;
    }
    title.appendChild(name);
    title.appendChild(desc);

    var tags = document.createElement('div');
    tags.className = 'trophy-tags';
    tags.appendChild(pillFor(t, t.grade.charAt(0).toUpperCase() + t.grade.slice(1), 'pill--' + t.grade));
    tags.appendChild(pillFor(t, KIND_LABELS[t.kind] || t.kind));
    if (t.count) tags.appendChild(pillFor(t, '× ' + t.count.toLocaleString('en-US')));
    if (t.missable) tags.appendChild(pillFor(t, 'Missable', 'pill--missable'));
    else if (t.hidden) tags.appendChild(pillFor(t, 'Hidden', 'pill--hidden'));
    title.appendChild(tags);
    head.appendChild(title);
    card.appendChild(head);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'trophy-detail-btn';
    btn.setAttribute('aria-expanded', openId === t.id ? 'true' : 'false');
    var btnLabel = document.createElement('span');
    btnLabel.textContent = openId === t.id ? 'Hide guide' : 'Guide & sources';
    var chev = document.createElement('span');
    chev.className = 'chev';
    chev.setAttribute('aria-hidden', 'true');
    chev.textContent = '▾';
    btn.appendChild(btnLabel);
    btn.appendChild(chev);
    btn.addEventListener('click', function () {
      openId = openId === t.id ? null : t.id;
      renderList();
    });
    card.appendChild(btn);

    var detail = document.createElement('div');
    detail.className = 'trophy-detail';
    var inner = document.createElement('div');
    inner.className = 'trophy-detail-inner';
    var body = document.createElement('div');
    body.className = 'trophy-detail-body';
    if (isHiddenFromSpoiler(t)) {
      var note = document.createElement('p');
      note.className = 'spoiler-hidden';
      note.textContent = 'This guide stays hidden until the trophy is earned — turn off “Hide story spoilers” or tick the trophy to read it.';
      body.appendChild(note);
    } else {
      var hGuide = document.createElement('h4');
      hGuide.textContent = 'How to get it';
      body.appendChild(hGuide);
      var guide = document.createElement('p');
      guide.textContent = t.guide;
      body.appendChild(guide);
      var hRoad = document.createElement('h4');
      hRoad.textContent = 'When to do it';
      body.appendChild(hRoad);
      var road = document.createElement('p');
      road.textContent = ROADMAP_LABELS[t.roadmap] || '';
      body.appendChild(road);
      var hSrc = document.createElement('h4');
      hSrc.textContent = 'Sources';
      body.appendChild(hSrc);
      body.appendChild(sourceList(t.sources || []));
    }
    inner.appendChild(body);
    detail.appendChild(inner);
    card.appendChild(detail);

    return card;
  }

  function renderProgress() {
    var total = trophies.length || 55;
    var count = earned.size;
    var pct = total ? Math.round((count / total) * 100) : 0;
    document.getElementById('earnedCount').textContent = String(count);
    document.getElementById('earnedPoints').textContent = earnedPoints().toLocaleString('en-US');
    document.getElementById('earnedPct').textContent = pct + '%';
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressRing').style.setProperty('--pct', String(pct));
    document.getElementById('progressRing').setAttribute('aria-label', count + ' of ' + total + ' trophies earned');
    var note = document.getElementById('progressNote');
    if (count === total && total > 0) {
      note.textContent = 'Every trophy earned — Vice Got a Price! is yours. Leonida Legend.';
    } else if (count === 0) {
      note.textContent = 'Tick a trophy when you earn it. Your checklist is saved in this browser.';
    } else {
      note.textContent = 'Keep going — the platinum is earned one tick at a time.';
    }
  }

  function renderTabs() {
    var counts = { all: trophies.length, story: 0, missable: 0, collectibles: 0, activities: 0, online: 0 };
    trophies.forEach(function (t) { if (counts[t.kind] !== undefined) counts[t.kind] += 1; });
    document.querySelectorAll('.tab-count').forEach(function (el) {
      el.textContent = counts[el.dataset.count] || 0;
    });
    document.querySelectorAll('.tab').forEach(function (tab) {
      var active = tab.dataset.kind === kind;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    positionPill(false);
  }

  function positionPill(animate) {
    var active = tabsEl.querySelector('.tab.is-active');
    if (!active) return;
    if (!animate) pillEl.style.transition = 'none';
    pillEl.style.width = active.offsetWidth + 'px';
    pillEl.style.transform = 'translateX(' + active.offsetLeft + 'px)';
    if (!animate) {
      void pillEl.offsetWidth;
      pillEl.style.transition = '';
    }
  }

  function renderList() {
    var shown = trophies.filter(matches);
    listEl.replaceChildren();
    if (kind === 'online') {
      var empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'No online trophies — the whole list is single-player. GTA 6 has no online or DLC trophies at launch, so this filter is empty on purpose.';
      listEl.appendChild(empty);
    } else if (shown.length === 0) {
      var none = document.createElement('p');
      none.className = 'empty';
      none.textContent = query
        ? 'No trophies match “' + query + '”. Try a shorter search.'
        : 'Nothing here yet — try another filter.';
      listEl.appendChild(none);
    } else {
      shown.forEach(function (t) { listEl.appendChild(trophyCard(t)); });
    }
    metaEl.textContent = 'Showing ' + shown.length + ' of ' + trophies.length + ' trophies' +
      (query ? ' matching “' + query + '”' : '') + '.';
    renderProgress();
    renderTabs();
  }

  /* -- actions -------------------------------------------------------- */

  function toggleEarned(id) {
    if (earned.has(id)) earned.delete(id);
    else earned.add(id);
    saveState();
    renderList();
    var card = listEl.querySelector('[data-id="' + id + '"] .check');
    if (card) card.focus();
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-shown'); }, 2600);
  }

  function exportProgress() {
    var payload = {
      app: 'leonida-trophy-atlas',
      version: 1,
      exportedAt: new Date().toISOString(),
      earned: Array.from(earned).sort(function (a, b) { return a - b; })
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gta6-trophy-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    showToast('Progress exported — ' + earned.size + ' trophies in the file.');
  }

  function importProgress(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        var ids = Array.isArray(data) ? data : data.earned;
        if (!Array.isArray(ids)) throw new Error('no earned list');
        var next = new Set();
        ids.forEach(function (raw) {
          var id = Number(raw);
          if (isKnownId(id)) next.add(id);
        });
        earned = next;
        saveState();
        renderList();
        showToast('Progress imported — ' + earned.size + ' trophies ticked.');
      } catch (err) {
        showToast('That file is not a trophy progress export.');
      }
    };
    reader.readAsText(file);
  }

  function resetProgress() {
    if (!window.confirm('Clear every tick and start the checklist over?')) return;
    earned = new Set();
    saveState();
    renderList();
    showToast('Checklist cleared.');
  }

  /* -- wiring --------------------------------------------------------- */

  searchEl.addEventListener('input', function () {
    query = searchEl.value.trim();
    renderList();
  });

  spoilerEl.addEventListener('change', function () {
    spoiler = spoilerEl.checked;
    saveState();
    renderList();
    showToast(spoiler ? 'Story spoilers hidden until earned.' : 'Story spoilers shown.');
  });

  tabsEl.addEventListener('click', function (event) {
    var tab = event.target.closest('.tab');
    if (!tab) return;
    kind = tab.dataset.kind;
    saveState();
    renderList();
    positionPill(true);
  });

  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importBtn').addEventListener('click', function () {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', function (event) {
    importProgress(event.target.files[0]);
    event.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', resetProgress);

  window.addEventListener('resize', function () { positionPill(false); });

  /* -- boot ----------------------------------------------------------- */

  fetch('data/trophies.json')
    .then(function (response) {
      if (!response.ok) throw new Error('trophies.json failed to load');
      return response.json();
    })
    .then(function (doc) {
      trophies = doc.trophies || [];
      loadState();
      applyShotParams();
      spoilerEl.checked = spoiler;
      renderList();
      // Screenshot framing: ?scroll=list jumps to the checklist after the
      // list renders (a fragment scroll fires before the fetch lands, so
      // it lands in the wrong place once the cards grow the page).
      var scrollTarget = new URLSearchParams(window.location.search).get('scroll');
      if (scrollTarget) {
        var target = document.getElementById(scrollTarget);
        if (target) {
          // The stylesheet asks for smooth scrolling; a screenshot needs
          // the jump to land at once, not mid-glide.
          document.documentElement.style.scrollBehavior = 'auto';
          target.scrollIntoView();
        }
      }
      document.getElementById('progressNote').textContent =
        'Tick a trophy when you earn it. Your checklist is saved in this browser.';
    })
    .catch(function () {
      listEl.replaceChildren();
      var err = document.createElement('p');
      err.className = 'empty';
      err.textContent = 'The trophy list could not be loaded. Reload the page — the app needs its data file beside it.';
      listEl.appendChild(err);
    });
})();
