// ── Screen management ────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('wallpaper-layer')
    .classList.toggle('dimmed', id === 'screen-prompt');
  if (id !== 'screen-prompt' && id !== 'screen-cauldron-config') {
    currentPrompt = null;
    lockedSlots = {};
    clearHistory();
  }
}

// ── Prompt rendering ─────────────────────────────────────────
function fitPromptText() {
  const zone = document.getElementById('prompt-zone');
  const content = document.getElementById('prompt-content');
  if (!zone || !content) return;
  const MAX = 3.5;
  const MIN = 1.0;
  const STEP = 0.2;
  let size = MAX;
  content.style.fontSize = size + 'rem';
  while (content.scrollHeight > zone.clientHeight && size > MIN) {
    size = Math.max(MIN, parseFloat((size - STEP).toFixed(1)));
    content.style.fontSize = size + 'rem';
  }
}

const LOCK_SVG = '<svg class="lock-icon" width="16" height="18" viewBox="0 0 16 18" fill="none"><rect x="1" y="8" width="14" height="10" rx="2" stroke="#b85c38" stroke-width="2"/><path d="M4 8V6a4 4 0 0 1 8 0v2" stroke="#b85c38" stroke-width="2" stroke-linecap="round"/></svg>';

function renderPrompt(container, mode) {
  container.innerHTML = '';

  if (mode === 'cauldron') {
    const activeSlots = cauldronConfig.slots.filter(s => s.enabled);
    activeSlots.forEach((slot, i) => {
      const span = document.createElement('span');
      span.className = 'prompt-slot' + (lockedSlots[slot.id] ? ' locked' : '');
      span.dataset.slot = slot.id;
      span.innerHTML = (lockedSlots[slot.id] ? LOCK_SVG : '') + currentPrompt[slot.id];
      span.addEventListener('click', () => toggleLock(slot.id, container, mode));
      container.appendChild(span);
      if (i < activeSlots.length - 1) {
        const s = document.createElement('span');
        s.className = 'prompt-sep';
        s.textContent = ' · ';
        container.appendChild(s);
      }
    });

    const regenBtn = document.getElementById('prompt-regen-btn');
    if (regenBtn) {
      const allLocked = activeSlots.length > 0 &&
        activeSlots.every(s => lockedSlots[s.id]);
      regenBtn.disabled = allLocked;
    }
    return;
  }

  const slots = mode === 'surreal'
    ? ['adjective', 'noun', 'verb', 'environment']
    : ['noun1', 'noun2'];
  const sep = mode === 'surreal' ? ' · ' : ' + ';

  slots.forEach((slot, i) => {
    const span = document.createElement('span');
    span.className = 'prompt-slot' + (lockedSlots[slot] ? ' locked' : '');
    span.dataset.slot = slot;
    span.innerHTML = (lockedSlots[slot] ? LOCK_SVG : '') + currentPrompt[slot];
    span.addEventListener('click', () => toggleLock(slot, container, mode));
    container.appendChild(span);
    if (i < slots.length - 1) {
      const s = document.createElement('span');
      s.className = 'prompt-sep';
      s.textContent = sep;
      container.appendChild(s);
    }
  });
}

function animateSlot(el, pool, finalValue, durationMs) {
  if (el.classList.contains('locked')) return;
  const gen = (el.__animGen = (el.__animGen || 0) + 1);
  el.classList.add('animating');
  let elapsed = 0;
  let intervalTime = 55;

  function tick() {
    if (el.__animGen !== gen) return;
    el.textContent = pick(pool);
    elapsed += intervalTime;
    if (elapsed > durationMs * 0.55) {
      intervalTime = Math.min(intervalTime * 1.22, 320);
    }
    if (elapsed >= durationMs) {
      el.textContent = finalValue;
      el.classList.remove('animating');
      el.style.transition = 'transform 0.13s cubic-bezier(0.34,1.56,0.64,1)';
      el.style.transform = 'scale(1.18)';
      setTimeout(() => {
        if (el.__animGen !== gen) return;
        el.style.transform = 'scale(1)';
        setTimeout(() => {
          if (el.__animGen === gen) {
            el.style.transition = '';
            el.style.transform = '';
          }
        }, 130);
      }, 130);
      return;
    }
    setTimeout(tick, intervalTime);
  }
  tick();
}

function animateUnlockedSlots(container) {
  if (!currentPrompt) return;

  if (activeConfig && activeConfig.renderMode === 'cauldron' && cauldronConfig) {
    container.querySelectorAll('.prompt-slot:not(.locked)').forEach(span => {
      const slotId = span.dataset.slot;
      const slotDef = cauldronConfig.slots.find(s => s.id === slotId);
      if (!slotDef) return;
      let pool;
      if (slotDef.type === 'adjective') {
        pool = store.adjectives;
      } else if (slotDef.type === 'noun') {
        const full = slotDef.pool === 'organic'   ? store.nounsOrganicFull
                   : slotDef.pool === 'synthetic' ? store.nounsSyntheticFull
                   : [...store.nounsOrganicFull, ...store.nounsSyntheticFull];
        const filtered = filterByTags(full, slotDef.tags ?? [], slotDef.tagMode);
        pool = (filtered.length ? filtered : full).map(n => n.name);
      } else if (slotDef.type === 'verb') {
        const filtered = filterByTags(store.verbsFull, slotDef.tags ?? [], slotDef.tagMode);
        pool = (filtered.length ? filtered : store.verbsFull).map(n => n.name);
      } else if (slotDef.type === 'environment') {
        const filtered = filterByTags(store.environmentsFull, slotDef.tags ?? [], slotDef.tagMode);
        pool = (filtered.length ? filtered : store.environmentsFull).map(n => n.name);
      }
      if (pool && pool.length > 0) animateSlot(span, pool, currentPrompt[slotId], 1200);
    });
    return;
  }

  const pools = {
    adjective:   store.adjectives,
    noun:        Math.random() < 0.5 ? store.nounsOrganic : store.nounsSynthetic,
    verb:        store.verbs,
    environment: store.environments,
    noun1: currentPrompt.noun1Pool === 'organic' ? store.nounsOrganic : store.nounsSynthetic,
    noun2: currentPrompt.noun2Pool === 'organic' ? store.nounsOrganic : store.nounsSynthetic,
  };

  container.querySelectorAll('.prompt-slot:not(.locked)').forEach(span => {
    const slot = span.dataset.slot;
    if (!pools[slot]) { console.warn('animateUnlockedSlots: unknown slot', slot); return; }
    animateSlot(span, pools[slot], currentPrompt[slot], 1200);
  });
}

function toggleLock(slot, container, mode) {
  if (lockedSlots[slot]) {
    delete lockedSlots[slot];
  } else {
    lockedSlots[slot] = true;
  }
  renderPrompt(container, mode);
}

// ── History helpers ──────────────────────────────────────────
function clearHistory() {
  promptHistory = [];
  historyIndex = -1;
  document.getElementById('prompt-history-nav').classList.remove('visible');
}

function enterMode(config) {
  activeConfig = config;
  document.getElementById('prompt-screen-label').textContent = config.label;
  document.getElementById('prompt-back-btn').dataset.target = config.backTarget;

  const hasFilter = config.hasFilter;
  document.getElementById('prompt-filter-btn').classList.toggle('hidden', !hasFilter);
  document.getElementById('prompt-tag-indicator').classList.toggle('hidden', !hasFilter);
  document.getElementById('prompt-filter-sheet').classList.add('hidden');
  document.getElementById('prompt-filter-backdrop').classList.remove('visible');

  const hasLock = config.renderMode === 'cauldron';
  document.getElementById('prompt-lock-hint').classList.toggle('hidden', !hasLock);

  showScreen('screen-prompt');
}

function pushToHistory(prompt) {
  promptHistory.push(prompt);
  if (promptHistory.length > HISTORY_MAX) {
    promptHistory.shift();
  }
  historyIndex = promptHistory.length - 1;
}

function renderHistoryWidget() {
  const nav = document.getElementById('prompt-history-nav');
  const dotsContainer = document.getElementById('prompt-hist-dots');
  const prevBtn = document.getElementById('prompt-hist-prev');
  const nextBtn = document.getElementById('prompt-hist-next');

  if (promptHistory.length <= 1) {
    nav.classList.remove('visible');
    return;
  }

  nav.classList.add('visible');

  const total = promptHistory.length;
  const maxDots = Math.min(total, 7);
  const windowStart = Math.max(0, Math.min(historyIndex - 3, total - 7));

  dotsContainer.innerHTML = '';
  for (let i = windowStart; i < windowStart + maxDots; i++) {
    const dot = document.createElement('div');
    dot.className = 'hist-dot';
    if (i < historyIndex) dot.classList.add('filled');
    if (i === historyIndex) dot.classList.add('active');
    dotsContainer.appendChild(dot);
  }

  prevBtn.disabled = historyIndex === 0;
  nextBtn.disabled = historyIndex === promptHistory.length - 1;
}

function navigateHistory(direction) {
  const newIndex = historyIndex + direction;
  const container = document.getElementById('prompt-content');
  if (newIndex < 0 || newIndex >= promptHistory.length) {
    if (promptHistory.length > 1) {
      const cls = direction === -1 ? 'bounce-right' : 'bounce-left';
      container.classList.remove('bounce-left', 'bounce-right');
      void container.offsetWidth;
      container.classList.add(cls);
      setTimeout(() => container.classList.remove(cls), 380);
    }
    return;
  }
  historyIndex = newIndex;

  if (activeConfig.renderMode === 'pool') {
    container.textContent = promptHistory[historyIndex];
  } else {
    currentPrompt = promptHistory[historyIndex];
    renderPrompt(container, activeConfig.renderMode);
  }

  fitPromptText();
  if (typeof updateStar === 'function') updateStar();

  container.classList.remove('slide-from-left', 'slide-from-right');
  void container.offsetWidth;
  container.classList.add(direction === -1 ? 'slide-from-left' : 'slide-from-right');

  renderHistoryWidget();
}

// ── Copy button + swipe gestures ─────────────────────────────
function setupCopyBtn(btnId, getTextFn) {
  const btn = document.getElementById(btnId);
  btn.addEventListener('click', async () => {
    const text = getTextFn();
    if (!text) return;
    let success = false;
    try {
      await navigator.clipboard.writeText(text);
      success = true;
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-999px;left:-999px';
        document.body.appendChild(ta);
        ta.select();
        success = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e2) { /* nothing we can do */ }
    }
    if (success) {
      btn.textContent = '✓';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '⧉';
        btn.classList.remove('copied');
      }, 1500);
    }
  });
}

const SWIPE_THRESHOLD = 40;

function addSwipe(elementId) {
  let startX = null;
  const el = document.getElementById(elementId);
  el.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', e => {
    if (startX === null) return;
    const delta = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    navigateHistory(delta < 0 ? 1 : -1);
  });
}
