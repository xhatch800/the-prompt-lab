// ── Cauldron helpers ─────────────────────────────────────────
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
  const usedNames = {};

  for (const slot of activeSlots) {
    if (locked[slot.id] && prev[slot.id] != null) {
      result[slot.id] = prev[slot.id];
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

  const header = document.createElement('div');
  header.className = 'cc-slot-header';

  const nameEl = document.createElement('span');
  nameEl.className = 'cc-slot-name';
  const nounNum = slot.id.startsWith('noun_') ? parseInt(slot.id.split('_')[1], 10) : null;
  nameEl.textContent = slot.type === 'noun'
    ? (nounNum === 1 ? 'Noun' : `Noun ${nounNum}`)
    : slot.type.charAt(0).toUpperCase() + slot.type.slice(1);
  header.appendChild(nameEl);

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

  if (slot.type === 'adjective') {
    const note = document.createElement('span');
    note.className = 'cc-untagged-note';
    note.textContent = 'untagged — fully random';
    div.appendChild(note);
    return div;
  }

  if (slot.type === 'noun') {
    const poolDiv = document.createElement('div');
    poolDiv.className = 'cc-pool-toggle';
    ['organic', 'either', 'synthetic'].forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'cc-pool-btn' + (slot.pool === p ? ' active' : '');
      btn.textContent = p.charAt(0).toUpperCase() + p.slice(1);
      btn.addEventListener('click', () => {
        slot.pool = p;
        slot.tags = [];
        slot.tagMode = 'any';
        openTagPickerSlotId = null;
        renderCauldronConfig();
      });
      poolDiv.appendChild(btn);
    });
    div.appendChild(poolDiv);
  }

  const tagsArea = document.createElement('div');
  tagsArea.className = 'cc-tags-area';

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

  document.getElementById('cc-preset-surreal').classList.toggle('active', !isStrange);
  document.getElementById('cc-preset-strange').classList.toggle('active', isStrange);

  const slotsContainer = document.getElementById('cc-slots');
  slotsContainer.innerHTML = '';

  const activeSlots = cauldronConfig.slots.filter(s => s.enabled);
  activeSlots.forEach(slot => {
    slotsContainer.appendChild(buildSlotRow(slot, isStrange));
  });

  const nounCount = cauldronConfig.slots.filter(s => s.type === 'noun' && s.enabled).length;
  if (nounCount < 4) {
    const addNounBtn = document.createElement('button');
    addNounBtn.className = 'cc-add-noun';
    addNounBtn.textContent = '+ add another Noun';
    addNounBtn.addEventListener('click', () => {
      const usedNums = cauldronConfig.slots.filter(s => s.id.startsWith('noun_')).map(s => parseInt(s.id.split('_')[1], 10));
      const nextNum = (usedNums.length ? Math.max(...usedNums) : 0) + 1;
      const lastNounIdx = cauldronConfig.slots.reduce((acc, s, i) => s.type === 'noun' ? i : acc, -1);
      const newSlot = { id: `noun_${nextNum}`, type: 'noun', enabled: true, pool: 'either', tags: [], tagMode: 'any' };
      cauldronConfig.slots.splice(lastNounIdx + 1, 0, newSlot);
      renderCauldronConfig();
    });
    slotsContainer.appendChild(addNounBtn);
  }

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
          const existing = cauldronConfig.slots.find(s => s.type === type);
          if (existing) {
            existing.enabled = true;
          } else {
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
