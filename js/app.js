// ── Data store ──────────────────────────────────────────────
const store = {};

// ── State ────────────────────────────────────────────────────
let cauldronConfig = null;
let openTagPickerSlotId = null;
let activeConfig = null;
let currentPrompt = null;
let lockedSlots = {};

const HISTORY_MAX = 20;
let promptHistory = [];
let historyIndex = -1;

let cauldronDecks = {};

// ── Cauldron prompt-screen mode config ───────────────────────
const cauldronModeConfig = {
  mode:       'cldr',
  label:      'Surreal Cauldron',
  backTarget: 'screen-cauldron-config',
  hasFilter:  false,
  renderMode: 'cauldron',
};

function updateStar() {
  const btn = document.getElementById('prompt-star-btn');
  if (!btn) return;
  const text = document.getElementById('prompt-content').textContent.trim();
  const faved = text && Favorites.isFavorite(text);
  btn.textContent = faved ? '★' : '☆';
  btn.classList.toggle('starred', !!faved);
}

function buildFavoriteEntry(text) {
  const entry = { text, mode: activeConfig.mode };
  if (activeConfig.mode === 'cldr' && cauldronConfig) {
    entry.preset = cauldronConfig.preset;
    entry.slots = cauldronConfig.slots
      .filter(s => s.enabled)
      .map(s => ({ adjective: 'adj', noun: 'noun', verb: 'verb', environment: 'env' }[s.type] || s.type));
  }
  return entry;
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
  cauldronDecks = {};
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
  currentPrompt = generateCauldron(cauldronConfig, currentPrompt, lockedSlots);
  enterMode(cauldronModeConfig);
  const container = document.getElementById('prompt-content');
  renderPrompt(container, 'cauldron');
  fitPromptText();
  updateStar();
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
    fitPromptText();
    updateStar();
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

document.getElementById('prompt-star-btn').addEventListener('click', () => {
  const text = document.getElementById('prompt-content').textContent.trim();
  if (!text) return;
  if (Favorites.isFavorite(text)) {
    Favorites.remove(text);
  } else {
    Favorites.add(buildFavoriteEntry(text));
  }
  updateStar();
});

addSwipe('prompt-content');

// ── Favorites screen event wiring ───────────────────────────
document.getElementById('btn-favorites').addEventListener('click', () => {
  Favorites.renderScreen();
  showScreen('screen-favorites');
});

document.getElementById('btn-favorites-back').addEventListener('click', () => {
  showScreen('screen-home');
});

document.getElementById('fav-search').addEventListener('input', () => {
  Favorites.renderScreen();
});

document.getElementById('fav-export-btn').addEventListener('click', () => {
  Favorites.exportToFile();
});

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
    store.nounsOrganic        = nounsOrganicRaw.map(i => i.name);
    store.nounsSynthetic      = nounsSyntheticRaw.map(i => i.name);
    store.verbs               = verbsRaw.map(i => i.name);
    store.environments        = environmentsRaw.map(i => i.name);
    store.nounsOrganicFull    = nounsOrganicRaw;
    store.nounsSyntheticFull  = nounsSyntheticRaw;
    store.verbsFull           = verbsRaw;
    store.environmentsFull    = environmentsRaw;
    store.nounsOrganicTags    = [...new Set(nounsOrganicRaw.flatMap(i => i.tags))].sort();
    store.nounsSyntheticTags  = [...new Set(nounsSyntheticRaw.flatMap(i => i.tags))].sort();
    store.verbsTags           = [...new Set(verbsRaw.flatMap(i => i.tags))].sort();
    store.environmentsTags    = [...new Set(environmentsRaw.flatMap(i => i.tags))].sort();
    document.getElementById('btn-just-draw').disabled = false;
    document.getElementById('btn-cauldron').disabled = false;
    document.getElementById('btn-strange-scenes').disabled = false;
    document.getElementById('btn-favorites').disabled = false;
  } catch {
    document.getElementById('error-banner').classList.remove('hidden');
    document.getElementById('btn-just-draw').disabled = true;
    document.getElementById('btn-cauldron').disabled = true;
    document.getElementById('btn-strange-scenes').disabled = true;
  }
}

init();
