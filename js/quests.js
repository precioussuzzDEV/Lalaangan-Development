// ===== Lalaangan · Quests =====
// Placeholder data for the prototype. Later, update `cur` from the
// step counter / GPS check-ins instead of these fixed numbers.

const CATEGORIES = {
  daily:     { label: 'Daily',     color: 'var(--daily)' },
  explore:   { label: 'Explore',   color: 'var(--explore)' },
  community: { label: 'Community', color: 'var(--community)' }
};

const QUESTS = [
  { id: 'jetty',   cat: 'explore',   place: 'Jetty',     title: 'Jetty Sunset',   desc: 'Reach Kuala Penyu Jetty between 6 and 7 pm.',                cur: 1,    max: 1,    unit: '',      coins: 80,  xp: 40 },
  { id: 'stride',  cat: 'daily',     place: 'Anywhere',  title: 'Morning Stride', desc: 'Walk 3,000 steps before noon.',                               cur: 1840, max: 3000, unit: 'steps', coins: 50,  xp: 20 },
  { id: 'stretch', cat: 'daily',     place: 'Town',      title: 'Stretch Stop',   desc: 'Rest for 5 minutes at the town park.',                        cur: 0,    max: 1,    unit: '',      coins: 30,  xp: 10 },
  { id: 'wetland', cat: 'explore',   place: 'Klias',     title: 'Wetland Wander', desc: 'Walk 2 km along the Klias Wetlands boardwalk.',               cur: 0.6,  max: 2,    unit: 'km',    coins: 100, xp: 50 },
  { id: 'coast',   cat: 'community', place: 'Tempurung', title: 'Clean Coast',    desc: 'Snap a litter spot at Tempurung Beach for the clean-up crew.', cur: 0,    max: 1,    unit: '',      coins: 60,  xp: 30 },
  { id: 'buddy',   cat: 'community', place: 'Anywhere',  title: 'Walk Together',  desc: 'Walk 1 km with a friend who also plays.',                     cur: 0,    max: 1,    unit: '',      coins: 70,  xp: 30 }
];

// The step quest follows the shared step counter (js/activity.js)
const stepQuest = QUESTS.find(q => q.id === 'stride');
stepQuest.cur = Math.min(stepQuest.max, Lalaangan.getActivity().today.steps);

const REWARD = { done: 13, goal: 20 };

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'daily',     label: 'Daily' },
  { key: 'explore',   label: 'Explore' },
  { key: 'community', label: 'Community' }
];

const STORAGE_KEY = 'lalaangan.quests.claimed';

const state = {
  tab: 'all',
  claimed: loadClaimed()
};

// ---------- Storage (safe if blocked) ----------
function loadClaimed() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveClaimed() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.claimed));
  } catch (e) { /* storage unavailable – keep in memory only */ }
}

// ---------- Helpers ----------
const $ = (sel) => document.querySelector(sel);

function fmt(n) {
  return n >= 1000 ? n.toLocaleString('en-US') : String(n);
}

function progressText(q) {
  if (q.unit) return `${fmt(q.cur)} / ${fmt(q.max)} ${q.unit}`;
  return q.cur >= q.max ? '1 / 1' : '0 / 1';
}

let toastTimer;
function showToast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-show'), 1800);
}

// ---------- Render: reward ----------
function renderReward() {
  const done = Math.min(REWARD.goal, REWARD.done + Object.keys(state.claimed).length);
  $('#rewardCount').textContent = done;
  $('#rewardGoal').textContent = REWARD.goal;
  // small delay so the bar animates on first load
  requestAnimationFrame(() => {
    $('#rewardBar').style.width = Math.round(done / REWARD.goal * 100) + '%';
  });
}

// ---------- Render: tabs ----------
function renderTabs() {
  const wrap = $('#tabs');
  wrap.innerHTML = '';
  TABS.forEach(t => {
    const count = t.key === 'all' ? QUESTS.length : QUESTS.filter(q => q.cat === t.key).length;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tab' + (state.tab === t.key ? ' is-active' : '');
    btn.setAttribute('aria-pressed', state.tab === t.key);
    btn.innerHTML = `${t.label}<span class="tab__count">${count}</span>`;
    btn.addEventListener('click', () => {
      state.tab = t.key;
      renderTabs();
      renderQuests();
    });
    wrap.appendChild(btn);
  });
}

// ---------- Render: quests ----------
const ICON_CHECK = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ICON_PIN = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';

function renderQuests() {
  const list = $('#questList');
  list.innerHTML = '';

  const visible = QUESTS.filter(q => state.tab === 'all' || q.cat === state.tab);
  $('#emptyState').hidden = visible.length > 0;

  visible.forEach(q => {
    const cat = CATEGORIES[q.cat];
    const done = q.cur >= q.max;
    const claimed = !!state.claimed[q.id];
    const pct = Math.min(100, Math.round(q.cur / q.max * 100));

    const li = document.createElement('li');
    li.className = 'quest'
      + (q.cur > 0 && !done ? ' is-started' : '')
      + (done ? ' is-done' : '')
      + (claimed ? ' is-claimed' : '');
    li.style.setProperty('--cat', cat.color);

    let action;
    if (claimed) {
      action = `<span class="claimed">${ICON_CHECK}Claimed</span>`;
    } else if (done) {
      action = `<button type="button" class="btn-claim" data-claim="${q.id}">Claim</button>`;
    } else {
      action = `<button type="button" class="btn-map" data-map="${q.id}" aria-label="Show ${q.title} on map">${ICON_PIN}</button>`;
    }

    li.innerHTML = `
      <div class="node">${ICON_CHECK}</div>
      <article class="card">
        <span class="card__cat">${cat.label} · ${q.place}</span>
        <h2 class="card__title">${q.title}</h2>
        <p class="card__desc">${q.desc}</p>
        <div class="card__progress">
          <div class="bar"><div class="bar__fill" style="width:${pct}%"></div></div>
          <span class="card__count">${progressText(q)}</span>
        </div>
        <div class="card__foot">
          <div class="chips">
            <span class="chip chip--coin">+${q.coins} coins</span>
            <span class="chip chip--xp">+${q.xp} XP</span>
          </div>
          ${action}
        </div>
      </article>`;
    list.appendChild(li);
  });
}

// ---------- Events ----------
$('#questList').addEventListener('click', (e) => {
  const claimBtn = e.target.closest('[data-claim]');
  if (claimBtn) {
    const q = QUESTS.find(x => x.id === claimBtn.dataset.claim);
    state.claimed[q.id] = true;
    saveClaimed();
    showToast(`+${q.coins} coins · +${q.xp} XP`);
    renderQuests();
    renderReward();
    return;
  }

  const mapBtn = e.target.closest('[data-map]');
  if (mapBtn) {
    // Hand the quest id to the map screen so it can focus that spot
    const url = 'map.html?quest=' + encodeURIComponent(mapBtn.dataset.map);
    if (window.Lalaangan && Lalaangan.goTo) Lalaangan.goTo(url); else window.location.href = url;
  }
});

// ---------- Init ----------
renderTabs();
renderQuests();
renderReward();