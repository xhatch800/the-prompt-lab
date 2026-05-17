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

function filterByTags(pool, tags, tagMode) {
  if (!tags || tags.length === 0) return pool;
  return tagMode === 'all'
    ? pool.filter(item => tags.every(t => item.tags.includes(t)))
    : pool.filter(item => tags.some(t => item.tags.includes(t)));
}
