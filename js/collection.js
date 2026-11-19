/* ==========================================================================
   Lalaangan — Collection screen
   Plain JavaScript, no libraries. Loaded at the end of collection.html.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. DATA
   This is the only part you need to edit when you have real creatures.
   Everything below section 2 works off whatever is in here.
   -------------------------------------------------------------------------- */

/* The five areas of Kuala Penyu a creature can come from.
   colour  = the creature's body colour on this screen
   clue    = shown on the card and in the sheet while it is still locked */
const REGIONS = {
  Coast:    { colour: '#6FA8C7', clue: 'Discover this creature near the coast.' },
  Mangrove: { colour: '#6BAA84', clue: 'Look near the mangroves where the tide meets the land.' },
  Town:     { colour: '#D4A55F', clue: 'Found among the shops and streets of the town.' },
  Fields:   { colour: '#B9B35C', clue: 'Wander through the paddy fields to find it.' },
  Forest:   { colour: '#8C7BB5', clue: 'Hides along the quiet forest paths.' }
};

/* Rarity colors. The names here must match the rarity values used below. */
const RARITY_COLOUR = {
  Common:     'var(--r-common)',
  Uncommon:   'var(--r-uncommon)',
  Rare:       'var(--r-rare)',
  Legendary:  'var(--r-legendary)'
};

/* The 30 creatures.
   discovered: a date string means the player has it; null means still locked.
   Delete a date to lock a creature, add one to unlock it. */
const CREATURES = [
  { name: 'Ombak',    region: 'Coast',    rarity: 'Common',     discovered: '2026-10-02', condition: 'Appears at sunrise',
    img: 'assets/creatures/creature-01.png' },   /* real artwork; add img to any other creature the same way */
  { name: 'Camar',    region: 'Coast',    rarity: 'Common',     discovered: '2026-10-03', condition: 'Walk 3 km in one day' },
  { name: 'Kerang',   region: 'Coast',    rarity: 'Uncommon',   discovered: '2026-10-05', condition: 'Only appears after rain' },
  { name: 'Pasir',    region: 'Coast',    rarity: 'Uncommon',   discovered: '2026-10-09', condition: 'Appears in the evening' },
  { name: 'Karang',   region: 'Coast',    rarity: 'Rare',       discovered: null,         condition: 'Keep a 5 day walking streak' },
  { name: 'Rumpai',   region: 'Coast',    rarity: 'Legendary',  discovered: null,         condition: 'Reach a milestone reward' },

  { name: 'Bakau',    region: 'Mangrove', rarity: 'Common',     discovered: '2026-10-04', condition: 'Appears at sunrise' },
  { name: 'Nipah',    region: 'Mangrove', rarity: 'Common',     discovered: '2026-10-06', condition: 'Walk 3 km in one day' },
  { name: 'Belanak',  region: 'Mangrove', rarity: 'Uncommon',   discovered: '2026-10-10', condition: 'Only appears after rain' },
  { name: 'Kepiting', region: 'Mangrove', rarity: 'Uncommon',   discovered: null,         condition: 'Appears in the evening' },
  { name: 'Lumpur',   region: 'Mangrove', rarity: 'Rare',       discovered: null,         condition: 'Keep a 5 day walking streak' },
  { name: 'Siput',    region: 'Mangrove', rarity: 'Legendary',  discovered: null,         condition: 'Reach a milestone reward' },

  { name: 'Pasar',    region: 'Town',     rarity: 'Common',     discovered: '2026-10-07', condition: 'Appears at sunrise' },
  { name: 'Lampu',    region: 'Town',     rarity: 'Common',     discovered: '2026-10-08', condition: 'Walk 3 km in one day' },
  { name: 'Kopi',     region: 'Town',     rarity: 'Uncommon',   discovered: '2026-10-11', condition: 'Only appears after rain' },
  { name: 'Jalan',    region: 'Town',     rarity: 'Uncommon',   discovered: null,         condition: 'Appears in the evening' },
  { name: 'Kedai',    region: 'Town',     rarity: 'Rare',       discovered: null,         condition: 'Keep a 5 day walking streak' },
  { name: 'Menara',   region: 'Town',     rarity: 'Legendary',  discovered: null,         condition: 'Reach a milestone reward' },

  { name: 'Padi',     region: 'Fields',   rarity: 'Common',     discovered: '2026-10-09', condition: 'Appears at sunrise' },
  { name: 'Sawah',    region: 'Fields',   rarity: 'Common',     discovered: '2026-10-12', condition: 'Walk 3 km in one day' },
  { name: 'Kerbau',   region: 'Fields',   rarity: 'Uncommon',   discovered: null,         condition: 'Only appears after rain' },
  { name: 'Tuai',     region: 'Fields',   rarity: 'Uncommon',   discovered: null,         condition: 'Appears in the evening' },
  { name: 'Embun',    region: 'Fields',   rarity: 'Rare',       discovered: null,         condition: 'Keep a 5 day walking streak' },
  { name: 'Bijan',    region: 'Fields',   rarity: 'Legendary',  discovered: null,         condition: 'Reach a milestone reward' },

  { name: 'Rimba',    region: 'Forest',   rarity: 'Common',     discovered: null,         condition: 'Appears at sunrise' },
  { name: 'Pakis',    region: 'Forest',   rarity: 'Common',     discovered: null,         condition: 'Walk 3 km in one day' },
  { name: 'Rusa',     region: 'Forest',   rarity: 'Uncommon',   discovered: null,         condition: 'Only appears after rain' },
  { name: 'Kabus',    region: 'Forest',   rarity: 'Uncommon',   discovered: null,         condition: 'Appears in the evening' },
  { name: 'Akar',     region: 'Forest',   rarity: 'Rare',       discovered: null,         condition: 'Keep a 5 day walking streak' },
  { name: 'Burung',   region: 'Forest',   rarity: 'Legendary',  discovered: null,         condition: 'Reach a milestone reward' }
];

/* Give every creature an id so a card can point back to it */
CREATURES.forEach(function (creature, index) { creature.id = index; });


/* --------------------------------------------------------------------------
   2. STATE AND HELPERS
   -------------------------------------------------------------------------- */

let activeFilter = 'all';            /* 'all' | 'found' | 'locked' */
let activeRegion = 'all';            /* 'all' or a key of REGIONS */
let activeRarity = 'all';            /* 'all' or a key of RARITY_COLOUR */
let lastFocused = null;              /* so focus returns when the sheet closes */
let currentId = null;                /* creature shown in the sheet */
let renaming = false;                /* true while the rename box is open */

/* Nicknames chosen by the player: { creatureId: 'Name' }.
   The creature's own name in CREATURES is its species and never changes. */
const NICKNAME_KEY = 'lalaangan-nicknames';
const NICKNAME_MAX = 20;

function loadNicknames() {
  try { return JSON.parse(localStorage.getItem(NICKNAME_KEY)) || {}; }
  catch (e) { return {}; }
}

let nicknames = loadNicknames();

function displayName(creature) {
  return nicknames[creature.id] || creature.name;
}

function setNickname(creature, text) {
  const clean = text.trim().slice(0, NICKNAME_MAX);
  if (clean && clean !== creature.name) nicknames[creature.id] = clean;
  else delete nicknames[creature.id];
  try { localStorage.setItem(NICKNAME_KEY, JSON.stringify(nicknames)); }
  catch (e) { /* storage blocked: the name lasts until the page is closed */ }
}

const el = {
  filterBtn:   document.getElementById('filter-btn'),
  filterCount: document.getElementById('filter-count'),
  filterPanel: document.getElementById('filter-panel'),
  count:    document.getElementById('count'),
  chips:    document.getElementById('chips'),
  grid:     document.getElementById('grid'),
  overlay:  document.getElementById('overlay'),
  sheet:    document.getElementById('sheet')
};

function isFound(creature) {
  return Boolean(creature.discovered);
}

function foundCount() {
  return CREATURES.filter(isFound).length;
}

/* Escape text before putting it into HTML, so a creature name with an
   apostrophe or a < sign can never break the page. */
function esc(text) {
  return String(text).replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}

function formatDate(iso) {
  const date = new Date(iso + 'T00:00:00');
  if (isNaN(date)) return iso;
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}


/* --------------------------------------------------------------------------
   3. CREATURE ARTWORK
   Placeholder art drawn in SVG. When your real sprites are ready, replace the
   whole function body with something like:
       return '<img src="art/' + creature.name + '.png" width="' + size + '">';
   -------------------------------------------------------------------------- */

function art(creature, size) {
  const locked = !isFound(creature);
  const fill = locked ? 'var(--sil)' : REGIONS[creature.region].colour;
  const height = Math.round(size * 92 / 80);

  /* Real artwork: a creature with an img (and already discovered) shows its PNG */
  if (creature.img && !locked) {
    return '<img src="' + creature.img + '" alt="" width="' + size + '" height="' + height + '"' +
      ' style="object-fit:contain" draggable="false">';
  }

  const eyes = locked ? '' :
    '<circle cx="35" cy="24" r="2.3" fill="#1a1a1a"/>' +
    '<circle cx="46" cy="24" r="2.3" fill="#1a1a1a"/>';

  const mark = locked ?
    '<text x="40" y="40" text-anchor="middle" font-size="22" font-weight="600" fill="var(--sil-mark)">?</text>' : '';

  return '' +
    '<svg viewBox="0 0 80 92" width="' + size + '" height="' + height + '" aria-hidden="true">' +
      '<g transform="rotate(3 40 40)"><rect x="25" y="8" width="30" height="46" rx="3" fill="' + fill + '"/></g>' +
      '<path d="M26 28 Q14 28 12 42" stroke="' + fill + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
      '<path d="M54 28 Q66 28 68 42" stroke="' + fill + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
      '<rect x="31" y="54" width="5" height="14" fill="' + fill + '"/>' +
      '<rect x="46" y="54" width="5" height="14" fill="' + fill + '"/>' +
      '<rect x="28" y="66" width="11" height="5" rx="2.5" fill="' + fill + '"/>' +
      '<rect x="43" y="66" width="11" height="5" rx="2.5" fill="' + fill + '"/>' +
      eyes + mark +
    '</svg>';
}


/* --------------------------------------------------------------------------
   4. RENDERING
   -------------------------------------------------------------------------- */

function renderHeader() {
  const found = foundCount();
  const total = CREATURES.length;

  el.count.textContent = found + ' / ' + total + ' discovered';
}

function cardHTML(creature) {
  const found = isFound(creature);
  const colour = RARITY_COLOUR[creature.rarity];
  const clue = REGIONS[creature.region].clue;

  const label = found
    ? displayName(creature) + ', ' + creature.rarity
    : 'Undiscovered creature. ' + clue;

  return '' +
    '<button type="button" class="card ' + (found ? 'is-found' : 'is-locked') + '"' +
      ' style="--rarity: ' + colour + '"' +
      ' data-id="' + creature.id + '"' +
      ' aria-label="' + esc(label) + '">' +
      art(creature, 76) +
      '<span class="name">' + (found ? esc(displayName(creature)) : 'Undiscovered') + '</span>' +
      (found
        ? '<span class="rarity">' + esc(creature.rarity) + '</span>'
        : '<span class="clue">' + esc(clue) + '</span>') +
    '</button>';
}

function renderGrid() {
  let list = CREATURES;
  if (activeFilter === 'found')  list = CREATURES.filter(isFound);
  if (activeFilter === 'locked') list = CREATURES.filter(function (c) { return !isFound(c); });

  if (activeRegion !== 'all') list = list.filter(function (c) { return c.region === activeRegion; });
  if (activeRarity !== 'all') list = list.filter(function (c) { return c.rarity === activeRarity; });

  el.grid.innerHTML = list.length
    ? list.map(cardHTML).join('')
    : '<p class="empty">No creatures match these filters.</p>';
}

/* Region and rarity options inside the Filter panel */
function optionsHTML(group, names, active) {
  return '<div class="filter-opts">' +
    ['all'].concat(names).map(function (name) {
      return '<button type="button" data-' + group + '="' + name + '"' +
        (name === active ? ' class="on"' : '') + '>' +
        (name === 'all' ? 'All' : esc(name)) + '</button>';
    }).join('') +
  '</div>';
}

function renderFilterPanel() {
  el.filterPanel.innerHTML =
    '<div class="filter-group"><p class="label">Region</p>' +
      optionsHTML('region', Object.keys(REGIONS), activeRegion) + '</div>' +
    '<div class="filter-group"><p class="label">Rarity</p>' +
      optionsHTML('rarity', Object.keys(RARITY_COLOUR), activeRarity) + '</div>' +
    '<button type="button" class="filter-clear" data-clear-filters>Clear filters</button>';

  /* Badge on the Filter button shows how many extra filters are on */
  const active = (activeRegion !== 'all' ? 1 : 0) + (activeRarity !== 'all' ? 1 : 0);
  el.filterCount.textContent = active;
  el.filterCount.hidden = active === 0;
}

function render() {
  renderHeader();
  renderFilterPanel();
  renderGrid();
}


/* --------------------------------------------------------------------------
   5. DETAIL SHEET
   -------------------------------------------------------------------------- */

function sheetHTML(creature) {
  const found = isFound(creature);
  const colour = RARITY_COLOUR[creature.rarity];
  const clue = REGIONS[creature.region].clue;

  let html =
    '<button type="button" class="sheet-close" data-close aria-label="Close">&times;</button>' +
    '<div class="sheet-art">' + art(creature, 112) + '</div>';

  if (!found) {
    html +=
      '<h2>Undiscovered creature</h2>' +
      '<span class="badge">Rarity unknown</span>' +
      '<div class="clue-box"><b>Clue:</b> ' + esc(clue) + '</div>' +
      '<p class="label">Condition</p>' +
      '<p class="value">' + esc(creature.condition) + '</p>' +
      '<button type="button" class="sheet-btn" data-close>Open map</button>';
    return html;
  }

  const nameBlock = renaming
    ? '<form class="rename-form" data-rename-form>' +
        '<input class="rename-input" name="nickname" maxlength="' + NICKNAME_MAX + '"' +
          ' value="' + esc(displayName(creature)) + '" aria-label="Creature name" autocomplete="off">' +
        '<button type="submit" class="rename-save">Save</button>' +
        '<button type="button" class="rename-cancel" data-rename-cancel>Cancel</button>' +
      '</form>'
    : '<div class="name-row">' +
        '<h2>' + esc(displayName(creature)) + '</h2>' +
        '<button type="button" class="rename-btn" data-rename aria-label="Rename creature">&#9998;</button>' +
      '</div>';

  html +=
    nameBlock +
    '<p class="species">Species: ' + esc(creature.name) + '</p>' +
    '<span class="badge" style="--rarity: ' + colour + '">' + esc(creature.rarity) + '</span>' +

    '<p class="label">Origin</p>' +
    '<p class="value">' + esc(creature.region) + ', Kuala Penyu</p>' +

    '<p class="label">Description</p>' +
    '<p class="value">Placeholder description for ' + esc(displayName(creature)) +
      '. Replace this with one or two lines about the creature.</p>' +

    '<p class="label">Local story</p>' +
    '<p class="value">Placeholder legend. Replace this with a real story or fact ' +
      'about this part of Kuala Penyu.</p>' +

    '<p class="label">Discovered</p>' +
    '<p class="value">' + esc(formatDate(creature.discovered)) + '</p>';

  return html;
}

function openSheet(id) {
  const creature = CREATURES[id];
  if (!creature) return;

  lastFocused = document.activeElement;
  currentId = id;
  renaming = false;

  el.sheet.innerHTML = sheetHTML(creature);
  el.sheet.scrollTop = 0;
  el.sheet.classList.add('is-open');
  el.overlay.classList.add('is-open');

  /* Stop the grid behind the sheet from scrolling while it is open */
  document.body.classList.add('sheet-open');

  /* preventScroll keeps the page behind from jumping when focus moves */
  const close = el.sheet.querySelector('.sheet-close');
  if (close) close.focus({ preventScroll: true });
}

/* Redraw the open sheet, keeping its scroll position, then focus something useful */
function refreshSheet() {
  const scroll = el.sheet.scrollTop;
  el.sheet.innerHTML = sheetHTML(CREATURES[currentId]);
  el.sheet.scrollTop = scroll;

  const target = renaming
    ? el.sheet.querySelector('.rename-input')
    : el.sheet.querySelector('.rename-btn');
  if (target) target.focus({ preventScroll: true });
  if (renaming && target) target.select();
}

function closeSheet() {
  renaming = false;
  el.sheet.classList.remove('is-open');
  el.overlay.classList.remove('is-open');
  document.body.classList.remove('sheet-open');
  if (lastFocused) lastFocused.focus({ preventScroll: true });
}


/* --------------------------------------------------------------------------
   6. EVENTS
   One listener on the document handles every click, so cards redrawn by
   renderGrid() keep working without re-attaching anything.
   -------------------------------------------------------------------------- */

document.addEventListener('click', function (event) {

  const chip = event.target.closest('[data-filter]');
  if (chip) {
    activeFilter = chip.dataset.filter;
    el.chips.querySelectorAll('button').forEach(function (button) {
      button.classList.toggle('on', button === chip);
    });
    renderGrid();
    return;
  }

  if (event.target.closest('#filter-btn')) {
    const open = el.filterPanel.hidden;
    el.filterPanel.hidden = !open;
    el.filterBtn.setAttribute('aria-expanded', String(open));
    return;
  }

  const region = event.target.closest('[data-region]');
  const rarity = event.target.closest('[data-rarity]');
  if (region || rarity || event.target.closest('[data-clear-filters]')) {
    if (region) activeRegion = region.dataset.region;
    if (rarity) activeRarity = rarity.dataset.rarity;
    if (!region && !rarity) { activeRegion = 'all'; activeRarity = 'all'; }
    renderFilterPanel();
    renderGrid();
    return;
  }

  if (event.target.closest('[data-rename]')) {
    renaming = true;
    refreshSheet();
    return;
  }

  if (event.target.closest('[data-rename-cancel]')) {
    renaming = false;
    refreshSheet();
    return;
  }

  if (event.target.closest('[data-close]')) {
    closeSheet();
    return;
  }

  const card = event.target.closest('[data-id]');
  if (card) {
    openSheet(Number(card.dataset.id));
  }
});

document.addEventListener('submit', function (event) {
  if (!event.target.matches('[data-rename-form]')) return;
  event.preventDefault();
  setNickname(CREATURES[currentId], event.target.elements.nickname.value);
  renaming = false;
  refreshSheet();
  renderGrid();
});

document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape') return;
  if (renaming) {            /* first Escape only closes the rename box */
    renaming = false;
    refreshSheet();
  } else {
    closeSheet();
  }
});


/* --------------------------------------------------------------------------
   7. START
   -------------------------------------------------------------------------- */

render();