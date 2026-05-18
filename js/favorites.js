const Favorites = (() => {
  const KEY = 'promptlab_favorites';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  }

  function save(arr) {
    localStorage.setItem(KEY, JSON.stringify(arr));
  }

  function add(entry) {
    const arr = load();
    if (arr.some(e => e.text === entry.text)) return;
    arr.unshift(entry);
    save(arr);
  }

  function remove(text) {
    save(load().filter(e => e.text !== text));
  }

  function isFavorite(text) {
    return load().some(e => e.text === text);
  }

  function getAll() {
    return load();
  }

  function exportToFile() {
    const arr = load();
    if (arr.length === 0) return;
    const lines = arr.map(e => e.text).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promptlab-favorites.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderScreen() {
    const query = (document.getElementById('fav-search')?.value || '').toLowerCase().trim();
    const all = load();
    const items = query
      ? all.filter(e => e.text.toLowerCase().includes(query))
      : all;

    const list = document.getElementById('fav-list');
    list.innerHTML = '';

    if (all.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'fav-empty';
      empty.textContent = 'No favorites yet — star a prompt to save it ★';
      list.appendChild(empty);
      document.getElementById('fav-export-btn').disabled = true;
      return;
    }

    document.getElementById('fav-export-btn').disabled = false;

    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'fav-empty';
      empty.textContent = 'No matches';
      list.appendChild(empty);
      return;
    }

    items.forEach(entry => {
      const row = document.createElement('div');
      row.className = 'fav-item';

      const text = document.createElement('span');
      text.className = 'fav-item-text';
      text.textContent = entry.text;
      row.appendChild(text);

      const del = document.createElement('button');
      del.className = 'fav-delete-btn';
      del.textContent = '×';
      del.setAttribute('aria-label', 'Remove from favorites');
      del.addEventListener('click', () => {
        remove(entry.text);
        renderScreen();
      });
      row.appendChild(del);

      list.appendChild(row);
    });
  }

  return { add, remove, isFavorite, getAll, exportToFile, renderScreen };
})();
