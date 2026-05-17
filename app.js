    // ── Data store ──────────────────────────────────────────────
    const store = {};

    // ── Utilities ───────────────────────────────────────────────
    function pick(arr) {
      if (!arr || arr.length === 0) return '';
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function drawFromDeck(deck, pool) {
      if (!pool || pool.length === 0) return '';
      if (deck.length === 0) {
        const reshuffled = shuffle(pool);
        deck.push(...reshuffled);
      }
      return deck.pop();
    }

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

    // ── Prompt generators ────────────────────────────────────────
    function generateSurrealNarrative(current, locked) {
      const prev = current || {};
      const adjective  = locked.adjective   ? prev.adjective   : pick(store.adjectives);
      const noun       = locked.noun        ? prev.noun        : (Math.random() < 0.5 ? pick(store.nounsOrganic) : pick(store.nounsSynthetic));
      const verb       = locked.verb        ? prev.verb        : pick(store.verbs);
      const environment = locked.environment ? prev.environment : pick(store.environments);
      return { adjective, noun, verb, environment };
    }

    // ── Prompt rendering ─────────────────────────────────────────
    const LOCK_SVG = '<svg class="lock-icon" width="16" height="18" viewBox="0 0 16 18" fill="none"><rect x="1" y="8" width="14" height="10" rx="2" stroke="#b85c38" stroke-width="2"/><path d="M4 8V6a4 4 0 0 1 8 0v2" stroke="#b85c38" stroke-width="2" stroke-linecap="round"/></svg>';

    function renderPrompt(container, mode) {
      container.innerHTML = '';

      // ── Cauldron mode: slots driven by cauldronConfig ──
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

        // Sync regen button disabled state with lock state
        const regenBtn = document.getElementById('prompt-regen-btn');
        if (regenBtn) {
          const allLocked = activeSlots.length > 0 &&
            activeSlots.every(s => lockedSlots[s.id]);
          regenBtn.disabled = allLocked;
        }
        return;
      }

      // ── Surreal / Mutations mode (existing) ──
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
      // Guard against double-invocation: cancel any in-flight animation on this element
      const gen = (el.__animGen = (el.__animGen || 0) + 1);
      el.classList.add('animating');
      let elapsed = 0;
      let intervalTime = 55;

      function tick() {
        if (el.__animGen !== gen) return; // stale — a newer animation has taken over
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
            if (el.__animGen !== gen) return; // still guard — another anim may have started
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

      // ── Cauldron mode ──
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

      // ── Existing surreal / mutations mode ──
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

    // ── Cauldron helpers ─────────────────────────────────────────
    function filterByTags(pool, tags, tagMode) {
      if (!tags || tags.length === 0) return pool;
      return tagMode === 'all'
        ? pool.filter(item => tags.every(t => item.tags.includes(t)))
        : pool.filter(item => tags.some(t => item.tags.includes(t)));
    }

    function getAvailableTags(slot) {
      if (slot.type === 'noun') {
        if (slot.pool === 'organic') return store.nounsOrganicTags;
        if (slot.pool === 'synthetic') return store.nounsSyntheticTags;
        return [...new Set([...store.nounsOrganicTags, ...store.nounsSyntheticTags])].sort();
      }
      if (slot.type === 'verb') return store.verbsTags;
      if (slot.type === 'environment') return store.environmentsTags;
      return [];
    }

    function initCauldronConfig(preset) {
      openTagPickerSlotId = null;
      if (preset === 'strange') {
        cauldronConfig = {
          preset: 'strange',
          slots: [
            { id: 'noun_1', type: 'noun', enabled: true, pool: 'either', tags: [], tagMode: 'any' },
            { id: 'noun_2', type: 'noun', enabled: true, pool: 'either', tags: [], tagMode: 'any' },
          ]
        };
      } else {
        cauldronConfig = {
          preset: 'surreal',
          slots: [
            { id: 'adjective',   type: 'adjective',   enabled: true },
            { id: 'noun_1',      type: 'noun',         enabled: true,  pool: 'either', tags: [], tagMode: 'any' },
            { id: 'verb',        type: 'verb',         enabled: true,  tags: [], tagMode: 'any' },
            { id: 'environment', type: 'environment',  enabled: true,  tags: [], tagMode: 'any' },
          ]
        };
      }
    }

    function generateCauldron(config, current, locked) {
      const prev = current || {};
      const result = {};
      const activeSlots = config.slots.filter(s => s.enabled);
      const usedNames = {}; // tracks used noun names per pool key to prevent duplicates

      for (const slot of activeSlots) {
        if (locked[slot.id] && prev[slot.id] != null) {
          result[slot.id] = prev[slot.id];
          // Track locked noun names so subsequent noun slots don't pick the same word
          if (slot.type === 'noun' && prev[slot.id]) {
            const poolKey = slot.pool;
            if (!usedNames[poolKey]) usedNames[poolKey] = new Set();
            usedNames[poolKey].add(prev[slot.id]);
          }
          continue;
        }

        if (slot.type === 'adjective') {
          if (!cauldronDecks[slot.id]) cauldronDecks[slot.id] = [];
          result[slot.id] = drawFromDeck(cauldronDecks[slot.id], store.adjectives);

        } else if (slot.type === 'noun') {
          const fullPool = slot.pool === 'organic'   ? store.nounsOrganicFull
                         : slot.pool === 'synthetic' ? store.nounsSyntheticFull
                         : [...store.nounsOrganicFull, ...store.nounsSyntheticFull];
          const filtered = filterByTags(fullPool, slot.tags ?? [], slot.tagMode);
          const candidates = filtered.length ? filtered : fullPool;
          // Duplicate prevention: exclude names already used from the same pool key
          const poolKey = slot.pool;
          if (!usedNames[poolKey]) usedNames[poolKey] = new Set();
          const deduped = candidates.filter(n => !usedNames[poolKey].has(n.name));
          const drawPool = (deduped.length ? deduped : candidates).map(n => n.name);
          if (!cauldronDecks[slot.id]) cauldronDecks[slot.id] = [];
          const chosen = drawFromDeck(cauldronDecks[slot.id], drawPool);
          result[slot.id] = chosen;
          usedNames[poolKey].add(chosen);

        } else if (slot.type === 'verb') {
          const filtered = filterByTags(store.verbsFull, slot.tags ?? [], slot.tagMode);
          const verbPool = (filtered.length ? filtered : store.verbsFull).map(i => i.name);
          if (!cauldronDecks[slot.id]) cauldronDecks[slot.id] = [];
          result[slot.id] = drawFromDeck(cauldronDecks[slot.id], verbPool);

        } else if (slot.type === 'environment') {
          const filtered = filterByTags(store.environmentsFull, slot.tags ?? [], slot.tagMode);
          const envPool = (filtered.length ? filtered : store.environmentsFull).map(i => i.name);
          if (!cauldronDecks[slot.id]) cauldronDecks[slot.id] = [];
          result[slot.id] = drawFromDeck(cauldronDecks[slot.id], envPool);
        }
      }
      return result;
    }

    function buildSlotRow(slot, isStrange) {
  const div = document.createElement('div');
  div.className = 'cc-slot';

  // ── Header ──
  const header = document.createElement('div');
  header.className = 'cc-slot-header';

  const nameEl = document.createElement('span');
  nameEl.className = 'cc-slot-name';
  const nounNum = slot.id.startsWith('noun_') ? parseInt(slot.id.split('_')[1], 10) : null;
  nameEl.textContent = slot.type === 'noun'
    ? (nounNum === 1 ? 'Noun' : `Noun ${nounNum}`)
    : slot.type.charAt(0).toUpperCase() + slot.type.slice(1);
  header.appendChild(nameEl);

  // Remove link (extra nouns only — noun_2 and beyond)
  if (slot.type === 'noun' && slot.id !== 'noun_1') {
    const removeBtn = document.createElement('button');
    removeBtn.className = 'cc-remove';
    removeBtn.textContent = 'remove';
    removeBtn.addEventListener('click', () => {
      cauldronConfig.slots = cauldronConfig.slots.filter(s => s.id !== slot.id);
      if (openTagPickerSlotId === slot.id) openTagPickerSlotId = null;
      renderCauldronConfig();
    });
    header.appendChild(removeBtn);
  }

  // Match count badge (tagged slots only, when ≥1 tag selected)
  if (slot.type !== 'adjective' && slot.tags && slot.tags.length > 0) {
    let pool;
    if (slot.type === 'noun') {
      const full = slot.pool === 'organic'   ? store.nounsOrganicFull
                 : slot.pool === 'synthetic' ? store.nounsSyntheticFull
                 : [...store.nounsOrganicFull, ...store.nounsSyntheticFull];
      pool = filterByTags(full, slot.tags, slot.tagMode);
    } else if (slot.type === 'verb') {
      pool = filterByTags(store.verbsFull, slot.tags, slot.tagMode);
    } else if (slot.type === 'environment') {
      pool = filterByTags(store.environmentsFull, slot.tags, slot.tagMode);
    }
    if (pool !== undefined) {
      const count = pool.length;
      const badge = document.createElement('span');
      badge.className = 'cc-match-badge' + (count === 0 ? ' cc-match-zero' : '');
      badge.textContent = count === 0 ? '0 matches' : `${count} matches`;
      header.appendChild(badge);
    }
  }

  // Toggle-off button (surreal mode only; not on noun slots — nouns are removed, not toggled)
  if (!isStrange && slot.type !== 'noun') {
    const tog = document.createElement('button');
    tog.className = 'cc-toggle-on';
    tog.setAttribute('aria-label', `Disable ${slot.type}`);
    tog.addEventListener('click', () => {
      slot.enabled = false;
      if (openTagPickerSlotId === slot.id) openTagPickerSlotId = null;
      renderCauldronConfig();
    });
    header.appendChild(tog);
  }

  div.appendChild(header);

  // ── Adjective: untagged note ──
  if (slot.type === 'adjective') {
    const note = document.createElement('span');
    note.className = 'cc-untagged-note';
    note.textContent = 'untagged — fully random';
    div.appendChild(note);
    return div;
  }

  // ── Pool toggle (nouns only) ──
  if (slot.type === 'noun') {
    const poolDiv = document.createElement('div');
    poolDiv.className = 'cc-pool-toggle';
    ['organic', 'either', 'synthetic'].forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'cc-pool-btn' + (slot.pool === p ? ' active' : '');
      btn.textContent = p.charAt(0).toUpperCase() + p.slice(1);
      btn.addEventListener('click', () => {
        slot.pool = p;
        slot.tags = []; // clear tags when pool changes — tags may no longer be valid
        slot.tagMode = 'any';
        openTagPickerSlotId = null;
        renderCauldronConfig();
      });
      poolDiv.appendChild(btn);
    });
    div.appendChild(poolDiv);
  }

  // ── Tags area ──
  const tagsArea = document.createElement('div');
  tagsArea.className = 'cc-tags-area';

  // ANY/ALL toggle (only when ≥1 tag selected)
  if (slot.tags.length > 0) {
    const anyAll = document.createElement('div');
    anyAll.className = 'cc-any-all';
    ['any', 'all'].forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'cc-any-all-btn' + (slot.tagMode === m ? ' active' : '');
      btn.textContent = m.toUpperCase();
      btn.addEventListener('click', () => {
        slot.tagMode = m;
        renderCauldronConfig();
      });
      anyAll.appendChild(btn);
    });
    tagsArea.appendChild(anyAll);
  }

  // Selected tag chips (each tappable to remove)
  slot.tags.forEach(tag => {
    const chip = document.createElement('span');
    chip.className = 'cc-tag-chip';
    chip.textContent = tag + ' ×';
    chip.addEventListener('click', () => {
      slot.tags = slot.tags.filter(t => t !== tag);
      if (slot.tags.length === 0) slot.tagMode = 'any';
      renderCauldronConfig();
    });
    tagsArea.appendChild(chip);
  });

  // + tag button
  const addTagBtn = document.createElement('button');
  const pickerOpen = openTagPickerSlotId === slot.id;
  addTagBtn.className = 'cc-tag-add' + (pickerOpen ? ' open' : '');
  addTagBtn.textContent = pickerOpen ? '+ tag ▴' : '+ tag ▾';
  addTagBtn.addEventListener('click', () => {
    openTagPickerSlotId = pickerOpen ? null : slot.id;
    renderCauldronConfig();
  });
  tagsArea.appendChild(addTagBtn);

  div.appendChild(tagsArea);

  // ── Inline tag picker panel ──
  if (pickerOpen) {
    const picker = document.createElement('div');
    picker.className = 'cc-tag-picker';

    const label = document.createElement('div');
    label.className = 'cc-tag-picker-label';
    label.textContent = 'Available tags — alphabetical';
    picker.appendChild(label);

    const chipsDiv = document.createElement('div');
    chipsDiv.className = 'cc-tag-picker-chips';
    const available = getAvailableTags(slot);
    available.forEach(tag => {
      const chip = document.createElement('button');
      const isSelected = slot.tags.includes(tag);
      chip.className = 'cc-avail-tag' + (isSelected ? ' selected' : '');
      chip.textContent = isSelected ? tag + ' ✓' : tag;
      chip.addEventListener('click', () => {
        if (isSelected) {
          slot.tags = slot.tags.filter(t => t !== tag);
          if (slot.tags.length === 0) slot.tagMode = 'any';
        } else {
          slot.tags.push(tag);
        }
        renderCauldronConfig();
      });
      chipsDiv.appendChild(chip);
    });
    picker.appendChild(chipsDiv);

    const doneBtn = document.createElement('button');
    doneBtn.className = 'cc-tag-done';
    doneBtn.textContent = 'done';
    doneBtn.addEventListener('click', () => {
      openTagPickerSlotId = null;
      renderCauldronConfig();
    });
    picker.appendChild(doneBtn);

    div.appendChild(picker);
  }

  return div;
}

function renderCauldronConfig() {
  const isStrange = cauldronConfig.preset === 'strange';

  // Update preset chips
  document.getElementById('cc-preset-surreal').classList.toggle('active', !isStrange);
  document.getElementById('cc-preset-strange').classList.toggle('active', isStrange);

  // Render active slots
  const slotsContainer = document.getElementById('cc-slots');
  slotsContainer.innerHTML = '';

  const activeSlots = cauldronConfig.slots.filter(s => s.enabled);
  activeSlots.forEach(slot => {
    slotsContainer.appendChild(buildSlotRow(slot, isStrange));
  });

  // + add another Noun (max 4)
  const nounCount = cauldronConfig.slots.filter(s => s.type === 'noun' && s.enabled).length;
  if (nounCount < 4) {
    const addNounBtn = document.createElement('button');
    addNounBtn.className = 'cc-add-noun';
    addNounBtn.textContent = '+ add another Noun';
    addNounBtn.addEventListener('click', () => {
      const usedNums = cauldronConfig.slots.filter(s => s.id.startsWith('noun_')).map(s => parseInt(s.id.split('_')[1], 10));
      const nextNum = (usedNums.length ? Math.max(...usedNums) : 0) + 1;
      // Insert new noun after last existing noun in slots array
      const lastNounIdx = cauldronConfig.slots.reduce((acc, s, i) => s.type === 'noun' ? i : acc, -1);
      const newSlot = { id: `noun_${nextNum}`, type: 'noun', enabled: true, pool: 'either', tags: [], tagMode: 'any' };
      cauldronConfig.slots.splice(lastNounIdx + 1, 0, newSlot);
      renderCauldronConfig();
    });
    slotsContainer.appendChild(addNounBtn);
  }

  // + add component (surreal mode only — shows inactive component types)
  if (!isStrange) {
    const inactiveTypes = ['adjective', 'verb', 'environment'].filter(type =>
      !cauldronConfig.slots.find(s => s.type === type && s.enabled)
    );
    if (inactiveTypes.length > 0) {
      const addCompDiv = document.createElement('div');
      addCompDiv.className = 'cc-add-comp';

      const addCompLabel = document.createElement('span');
      addCompLabel.className = 'cc-add-comp-label';
      addCompLabel.textContent = '+ add component';
      addCompDiv.appendChild(addCompLabel);

      const chipsDiv = document.createElement('div');
      chipsDiv.className = 'cc-add-comp-chips';
      inactiveTypes.forEach(type => {
        const chip = document.createElement('button');
        chip.className = 'cc-add-comp-chip';
        chip.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        chip.addEventListener('click', () => {
          // Re-enable the slot if it exists, otherwise add it
          const existing = cauldronConfig.slots.find(s => s.type === type);
          if (existing) {
            existing.enabled = true;
          } else {
            // Insert in canonical order: adjective first, then nouns, then verb, then environment
            const order = ['adjective', 'noun', 'verb', 'environment'];
            const newSlot = type === 'adjective'
              ? { id: type, type, enabled: true }
              : { id: type, type, enabled: true, tags: [], tagMode: 'any' };
            const insertBefore = cauldronConfig.slots.findIndex(s => order.indexOf(s.type) > order.indexOf(type));
            if (insertBefore === -1) cauldronConfig.slots.push(newSlot);
            else cauldronConfig.slots.splice(insertBefore, 0, newSlot);
          }
          renderCauldronConfig();
        });
        chipsDiv.appendChild(chip);
      });
      addCompDiv.appendChild(chipsDiv);
      slotsContainer.appendChild(addCompDiv);
    }
  }

  // Update generate button disabled state
  const hasZeroMatch = activeSlots.some(slot => {
    if (slot.type === 'adjective' || !slot.tags || slot.tags.length === 0) return false;
    let pool;
    if (slot.type === 'noun') {
      const full = slot.pool === 'organic'   ? store.nounsOrganicFull
                 : slot.pool === 'synthetic' ? store.nounsSyntheticFull
                 : [...store.nounsOrganicFull, ...store.nounsSyntheticFull];
      pool = filterByTags(full, slot.tags, slot.tagMode);
    } else if (slot.type === 'verb') {
      pool = filterByTags(store.verbsFull, slot.tags, slot.tagMode);
    } else if (slot.type === 'environment') {
      pool = filterByTags(store.environmentsFull, slot.tags, slot.tagMode);
    }
    return pool !== undefined && pool.length === 0;
  });
  document.getElementById('cc-generate').disabled = activeSlots.length === 0 || hasZeroMatch;
}

    function toggleLock(slot, container, mode) {
      if (lockedSlots[slot]
        delete lockedSlots[slot];
      } else {
        lockedSlots[slot] = true;
      }
      renderPrompt(container, mode);
    }

    // ── State ────────────────────────────────────────────────────
    // ── Cauldron state ───────────────────────────────────────────
    let cauldronConfig = null;       // { preset, slots } — set by initCauldronConfig()
    let openTagPickerSlotId = null;  // id of the slot whose inline tag picker is open
    let activeConfig = null;
    let currentPrompt = null;  // { adjective, noun, verb, environment } | { noun1, noun1Pool, noun2, noun2Pool }
    let lockedSlots = {};      // e.g. { verb: true } — reset on back navigation

    const HISTORY_MAX = 20;
    let promptHistory = [];    // string[] for Sparks; prompt object[] for Cauldron
    let historyIndex = -1;     // -1 = empty; 0 = oldest; length-1 = newest
    // ── Pool-mode configs ─────────────────────────────────────────
    const jdConfig = {
      getPool:    () => store.justDraw,
      getNames:   () => store.justDrawNames,
      textField:  'name',
      label:      'Everyday Life',
      backTarget: 'screen-home',
      sheetTitle: 'Filter by subject',
      hasFilter:  true,
      renderMode: 'pool',
      deck:       [],
      activeTags: [],
      tagMode:    'any',
      sheetTags:  [],
      sheetMode:  'any',
    };

    const ssConfig = {
      getPool:    () => store.strangeScenes,
      getNames:   () => store.strangeSceneTexts,
      textField:  'text',
      label:      'Strange Scenes',
      backTarget: 'screen-home',
      sheetTitle: 'Filter by theme',
      hasFilter:  true,
      renderMode: 'pool',
      deck:       [],
      activeTags: [],
      tagMode:    'any',
      sheetTags:  [],
      sheetMode:  'any',
    };

    const cauldronModeConfig = {
      label:      'Surreal Cauldron',
      backTarget: 'screen-cauldron-config',
      hasFilter:  false,
      renderMode: 'cauldron',
    };

    let cauldronDecks = {};    // { [slotId]: string[] } — reset on every Generate tap

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

      container.classList.remove('slide-from-left', 'slide-from-right');
      void container.offsetWidth;
      container.classList.add(direction === -1 ? 'slide-from-left' : 'slide-from-right');

      renderHistoryWidget();
    }

    // ── Shared pool-mode functions ────────────────────────────────

    function generateFromPool(cfg) {
      const fullPool = cfg.getPool();
      const pool = cfg.activeTags.length === 0
        ? fullPool
        : filterByTags(fullPool, cfg.activeTags, cfg.tagMode);
      const item = drawFromDeck(cfg.deck, pool.length > 0 ? pool : fullPool);
      return item ? item[cfg.textField] : '';
    }

    function regenPoolMode(cfg) {
      const finalValue = generateFromPool(cfg);
      const el = document.getElementById('prompt-content');
      el.textContent = finalValue;
      animateSlot(el, cfg.getNames(), finalValue, 1200);
      pushToHistory(finalValue);
      renderHistoryWidget();
    }

    function renderFilterSheet(cfg) {
      const chipsEl     = document.getElementById('prompt-tag-chips');
      const anyAllRow   = document.getElementById('prompt-any-all-row');
      const poolCountEl = document.getElementById('prompt-pool-count');
      const applyBtn    = document.getElementById('prompt-apply-btn');
      const aaBtns      = anyAllRow.querySelectorAll('.pm-aa-btn');

      document.getElementById('prompt-sheet-title').textContent = cfg.sheetTitle;

      const tags = [...new Set(cfg.getPool().flatMap(item => item.tags || []))].sort();
      chipsEl.innerHTML = '';
      tags.forEach(tag => {
        const chip = document.createElement('button');
        chip.className = 'pm-chip' + (cfg.sheetTags.includes(tag) ? ' on' : '');
        chip.textContent = tag.replace('_', ' ');
        chip.addEventListener('click', () => {
          if (cfg.sheetTags.includes(tag)) {
            cfg.sheetTags = cfg.sheetTags.filter(t => t !== tag);
            if (cfg.sheetTags.length === 0) cfg.sheetMode = 'any';
          } else {
            cfg.sheetTags = [...cfg.sheetTags, tag];
          }
          renderFilterSheet(cfg);
        });
        chipsEl.appendChild(chip);
      });

      anyAllRow.classList.toggle('hidden', cfg.sheetTags.length === 0);
      aaBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === cfg.sheetMode));

      const count = cfg.sheetTags.length === 0
        ? cfg.getPool().length
        : filterByTags(cfg.getPool(), cfg.sheetTags, cfg.sheetMode).length;
      poolCountEl.textContent = cfg.sheetTags.length > 0 ? `${count} prompts` : '';

      let warning = chipsEl.parentElement.querySelector('.pm-empty-warning');
      if (count === 0 && cfg.sheetTags.length > 0) {
        if (!warning) {
          warning = document.createElement('p');
          warning.className = 'pm-empty-warning';
          warning.textContent = "no prompts match — try 'any' or fewer tags";
          document.getElementById('prompt-any-all-row').after(warning);
        }
      } else if (warning) {
        warning.remove();
      }

      applyBtn.disabled = count === 0;
    }

    function openFilterSheet(cfg) {
      cfg.sheetTags = [...cfg.activeTags];
      cfg.sheetMode = cfg.tagMode;
      document.getElementById('prompt-filter-backdrop').classList.add('visible');
      document.getElementById('prompt-filter-sheet').classList.remove('hidden');
      document.getElementById('prompt-filter-btn').classList.add('active');
      renderFilterSheet(cfg);
    }

    function closeFilterSheet(cfg) {
      document.getElementById('prompt-filter-backdrop').classList.remove('visible');
      document.getElementById('prompt-filter-sheet').classList.add('hidden');
    }

    function applyFilter(cfg) {
      cfg.activeTags = [...cfg.sheetTags];
      cfg.tagMode    = cfg.sheetMode;
      cfg.deck       = [];
      closeFilterSheet(cfg);
      updateFilterBtn(cfg);
      updateTagIndicator(cfg);
    }

    function updateFilterBtn(cfg) {
      document.getElementById('prompt-filter-btn')
        .classList.toggle('active', cfg.activeTags.length > 0);
    }

    function updateTagIndicator(cfg) {
      const el = document.getElementById('prompt-tag-indicator');
      if (cfg.activeTags.length === 0) {
        el.textContent = '';
      } else {
        const labels = cfg.activeTags.map(t => t.replace('_', ' ')).join(', ');
        el.textContent = `${cfg.tagMode}: ${labels}`;
      }
    }

    // ── Event wiring ─────────────────────────────────────────────
    document.getElementById('btn-just-draw').addEventListener('click', () => {
      clearHistory();
      jdConfig.deck       = [];
      jdConfig.activeTags = [];
      jdConfig.tagMode    = 'any';
      updateFilterBtn(jdConfig);
      updateTagIndicator(jdConfig);
      enterMode(jdConfig);
      regenPoolMode(jdConfig);
    });

    document.getElementById('btn-strange-scenes').addEventListener('click', () => {
      clearHistory();
      ssConfig.deck       = [];
      ssConfig.activeTags = [];
      ssConfig.tagMode    = 'any';
      updateFilterBtn(ssConfig);
      updateTagIndicator(ssConfig);
      enterMode(ssConfig);
      regenPoolMode(ssConfig);
    });

    document.getElementById('btn-cauldron').addEventListener('click', () => {
      clearHistory();
      lockedSlots = {};
      initCauldronConfig('surreal');
      renderCauldronConfig();
      showScreen('screen-cauldron-config');
    });

    document.getElementById('btn-cauldron-back').addEventListener('click', () => {
      cauldronConfig = null;
      openTagPickerSlotId = null;
      showScreen('screen-home');
    });

    document.getElementById('cc-preset-surreal').addEventListener('click', () => {
      initCauldronConfig('surreal');
      renderCauldronConfig();
    });

    document.getElementById('cc-preset-strange').addEventListener('click', () => {
      initCauldronConfig('strange');
      renderCauldronConfig();
    });

    document.getElementById('cc-generate').addEventListener('click', () => {
      if (!cauldronConfig) return;
      cauldronDecks = {};
      clearHistory();
      lockedSlots = {};
      currentPrompt = generateCauldron(cauldronConfig, null, {});
      enterMode(cauldronModeConfig);
      const container = document.getElementById('prompt-content');
      renderPrompt(container, 'cauldron');
      const hint = document.getElementById('prompt-lock-hint');
      hint.classList.add('animating');
      animateUnlockedSlots(container);
      setTimeout(() => hint.classList.remove('animating'), 1200);
      pushToHistory(currentPrompt);
      renderHistoryWidget();
    });

    document.querySelectorAll('.back-btn[data-target]').forEach(btn => {
      btn.addEventListener('click', () => showScreen(btn.dataset.target));
    });

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
          // Fallback for file:// or non-secure contexts
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

    // ── Shared prompt screen event wiring ────────────────────────
    document.getElementById('prompt-filter-btn').addEventListener('click', () => openFilterSheet(activeConfig));
    document.getElementById('prompt-filter-backdrop').addEventListener('click', () => {
      closeFilterSheet(activeConfig);
      updateFilterBtn(activeConfig);
    });
    document.getElementById('prompt-clear-btn').addEventListener('click', () => {
      activeConfig.sheetTags = [];
      activeConfig.sheetMode = 'any';
      renderFilterSheet(activeConfig);
    });
    document.getElementById('prompt-apply-btn').addEventListener('click', () => {
      applyFilter(activeConfig);
      regenPoolMode(activeConfig);
    });
    document.querySelectorAll('#prompt-any-all-row .pm-aa-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeConfig.sheetMode = btn.dataset.mode;
        renderFilterSheet(activeConfig);
      });
    });

    document.getElementById('prompt-regen-btn').addEventListener('click', () => {
      if (activeConfig.renderMode === 'pool') {
        regenPoolMode(activeConfig);
      } else {
        const container = document.getElementById('prompt-content');
        currentPrompt = generateCauldron(cauldronConfig, currentPrompt, lockedSlots);
        renderPrompt(container, 'cauldron');
        const hint = document.getElementById('prompt-lock-hint');
        hint.classList.add('animating');
        animateUnlockedSlots(container);
        setTimeout(() => hint.classList.remove('animating'), 1200);
        pushToHistory(currentPrompt);
        renderHistoryWidget();
      }
    });

    document.getElementById('prompt-back-btn').addEventListener('click', () => {
      showScreen(activeConfig.backTarget);
    });

    document.getElementById('prompt-hist-prev').addEventListener('click', () => navigateHistory(-1));
    document.getElementById('prompt-hist-next').addEventListener('click', () => navigateHistory(1));

    setupCopyBtn('prompt-copy-btn', () =>
      document.getElementById('prompt-content').textContent.trim()
    );

    // ── Swipe gestures for history ────────────────────────────────
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

    addSwipe('prompt-content');

    // ── Data loading ─────────────────────────────────────────────
    async function init() {
      try {
        const [justDraw, strangeScenes, adjectives, nounsOrganicRaw, nounsSyntheticRaw, verbsRaw, environmentsRaw] =
          await Promise.all([
            fetch('data/just_draw_tagged.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
            fetch('data/strange_scenes.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
            fetch('data/adjectives.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
            fetch('data/nouns_organic_tagged.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
            fetch('data/nouns_synthetic_tagged.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
            fetch('data/verbs_tagged.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
            fetch('data/environments_tagged.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
          ]);

        if ([justDraw, strangeScenes, adjectives, nounsOrganicRaw, nounsSyntheticRaw, verbsRaw, environmentsRaw]
            .some(d => !Array.isArray(d) || d.length === 0)) {
          throw new Error('Empty data');
        }

        store.justDraw            = justDraw;
        store.justDrawNames       = justDraw.map(i => i.name);
        store.strangeScenes       = strangeScenes;
        store.strangeSceneTexts   = strangeScenes.map(i => i.text);
        store.adjectives          = adjectives;
        // Name-only arrays — used by existing generation functions unchanged
        store.nounsOrganic        = nounsOrganicRaw.map(i => i.name);
        store.nounsSynthetic      = nounsSyntheticRaw.map(i => i.name);
        store.verbs               = verbsRaw.map(i => i.name);
        store.environments        = environmentsRaw.map(i => i.name);
        // Full tagged objects — used by cauldron for tag filtering
        store.nounsOrganicFull    = nounsOrganicRaw;
        store.nounsSyntheticFull  = nounsSyntheticRaw;
        store.verbsFull           = verbsRaw;
        store.environmentsFull    = environmentsRaw;
        // Unique sorted tags extracted per pool — used by tag picker UI
        store.nounsOrganicTags    = [...new Set(nounsOrganicRaw.flatMap(i => i.tags))].sort();
        store.nounsSyntheticTags  = [...new Set(nounsSyntheticRaw.flatMap(i => i.tags))].sort();
        store.verbsTags           = [...new Set(verbsRaw.flatMap(i => i.tags))].sort();
        store.environmentsTags    = [...new Set(environmentsRaw.flatMap(i => i.tags))].sort();
        document.getElementById('btn-just-draw').disabled = false;
        document.getElementById('btn-cauldron').disabled = false;
        document.getElementById('btn-strange-scenes').disabled = false;
      } catch {
        document.getElementById('error-banner').classList.remove('hidden');
        document.getElementById('btn-just-draw').disabled = true;
        document.getElementById('btn-cauldron').disabled = true;
        document.getElementById('btn-strange-scenes').disabled = true;
      }
    }

    init();
