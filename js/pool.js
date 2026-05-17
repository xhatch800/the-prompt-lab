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

// ── Pool-mode functions ───────────────────────────────────────
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
