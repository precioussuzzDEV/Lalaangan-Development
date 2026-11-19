/* =========================================================
   Lalaangan · Settings popup logic
   Runs inside the popup layer opened by settings-overlay.js
   ========================================================= */
(() => {
  const STORE_KEY = 'lalaangan.settings';
  const DEFAULTS = {
    musicVolume: 35,   // 0 to 100, 0 = off
    sfxVolume: 50,     // 0 to 100, 0 = off
    haptics: true,
    notifications: false,
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- storage (safe in private mode) ----------
  function load() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') }; }
    catch { return { ...DEFAULTS }; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(settings)); } catch {}
  }
  const settings = load();

  // Tell the profile page (parent) about changes so it can react (e.g. mute music)
  const standalone = window.top === window.self;
  function notifyParent(type, payload = {}) {
    // Preview mode: closing or logging out goes to the profile screen
    if (standalone) {
      if (type === 'close') location.href = 'profile.html';
      if (type === 'logout' || type === 'delete-account') location.href = 'index.html';
      return;
    }
    try { window.parent.postMessage({ source: 'lalaangan-settings', type, ...payload }, '*'); } catch {}
  }

  function buzz(ms = 12) {
    if (settings.haptics && navigator.vibrate) navigator.vibrate(ms);
  }

  // ---------- toast ----------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  // ---------- open / close ----------
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-open')));

  function close() {
    document.body.classList.remove('is-open');
    setTimeout(() => notifyParent('close'), 260);
  }
  $$('[data-close]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('#confirm').hidden) return hideConfirm(false);
    if ($('.card').classList.contains('sub-open')) return closeSub();
    close();
  });

  // ---------- volume sliders (Music, Sound FX) ----------
  // Old versions saved an on/off switch: keep "off" as volume 0
  try {
    const old = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    if (old.musicVolume == null && old.music === false) settings.musicVolume = 0;
    if (old.sfxVolume == null && old.sfx === false) settings.sfxVolume = 0;
  } catch {}

  $$('[data-volume]').forEach(input => {
    const key = input.dataset.volume;
    const paint = () => {
      input.style.setProperty('--fill', input.value + '%');
    };
    input.value = settings[key];
    paint();

    // moving: change the loudness live (the music itself is the preview)
    input.addEventListener('input', () => {
      settings[key] = Number(input.value);
      save();
      paint();
      notifyParent('change', { key, value: settings[key] });
    });
    // let go: play a sample so you can hear the new effects loudness
    input.addEventListener('change', () => {
      if (key === 'sfxVolume' && window.Lalaangan && window.Lalaangan.playSfx) window.Lalaangan.playSfx('reward');
    });
  });

  // ---------- toggles ----------
  $$('[data-setting]').forEach(input => {
    const key = input.dataset.setting;
    input.checked = !!settings[key];

    input.addEventListener('change', async () => {
      if (key === 'notifications' && input.checked) {
        const ok = await askNotifications();
        if (!ok) { input.checked = false; return; }
      }
      settings[key] = input.checked;
      save();
      buzz();
      notifyParent('change', { key, value: input.checked });
    });
  });

  async function askNotifications() {
    if (!('Notification' in window)) {
      toast('Notifications aren’t supported in this browser. On iPhone, add Lalaangan to your Home Screen first.');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') {
      toast('Notifications are blocked. Turn them on in your browser settings.');
      return false;
    }
    try {
      const result = await Notification.requestPermission();
      if (result !== 'granted') toast('Notifications not allowed.');
      return result === 'granted';
    } catch {
      return false;
    }
  }

  // ---------- sub views (Credits / Support / Location) ----------
  const card = $('.card');
  let currentSub = null;

  function openSub(name) {
    const view = $(`#view-${name}`);
    if (!view) return;
    if (currentSub && currentSub !== view) { currentSub.classList.remove('shown'); currentSub.hidden = true; }
    view.hidden = false;
    requestAnimationFrame(() => view.classList.add('shown'));
    card.classList.add('sub-open');
    currentSub = view;
    $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.open === name));
    buzz(8);
  }
  function closeSub() {
    if (!currentSub) return;
    const view = currentSub;
    view.classList.remove('shown');
    card.classList.remove('sub-open');
    $$('.tabs button').forEach(b => b.classList.remove('active'));
    setTimeout(() => { view.hidden = true; }, 300);
    currentSub = null;
  }

  $$('[data-open]').forEach(btn => btn.addEventListener('click', () => {
    if (currentSub && currentSub.id === `view-${btn.dataset.open}`) closeSub();
    else openSub(btn.dataset.open);
  }));
  $$('[data-back]').forEach(btn => btn.addEventListener('click', closeSub));

  // ---------- location ----------
  const chip = $('#location-chip');
  const statusText = $('#location-status');
  const LABELS = {
    granted: ['Allowed', 'Location is allowed. Creatures near you can be discovered.'],
    prompt:  ['Ask', 'Lalaangan will ask for your location when you open the map.'],
    denied:  ['Blocked', 'Location is blocked, so creatures can’t be found. Follow the steps below to turn it on.'],
    unknown: ['Device setting', 'Your browser doesn’t report location status. Use the steps below to check.'],
  };

  function setLocationState(state) {
    const [label, msg] = LABELS[state] || LABELS.unknown;
    chip.className = 'loc-chip ' + state;
    chip.querySelector('span').textContent = label;
    statusText.textContent = msg;
  }

  async function checkLocation() {
    if (!('geolocation' in navigator)) return setLocationState('denied');
    try {
      const p = await navigator.permissions.query({ name: 'geolocation' });
      setLocationState(p.state);
      p.onchange = () => setLocationState(p.state);
    } catch {
      setLocationState('unknown');
    }
  }
  checkLocation();

  $('#location-row').addEventListener('click', () => openSub('location'));

  $('#location-request').addEventListener('click', () => {
    if (!('geolocation' in navigator)) return toast('Location isn’t available on this device.');
    navigator.geolocation.getCurrentPosition(
      () => { setLocationState('granted'); toast('Location allowed.'); },
      err => {
        if (err.code === err.PERMISSION_DENIED) { setLocationState('denied'); toast('Location was blocked.'); }
        else toast('Couldn’t get your location. Try again outdoors.');
      },
      { timeout: 10000 }
    );
  });

  // ---------- confirm dialog ----------
  let confirmResolve;
  function askConfirm({ title, message, ok = 'OK', danger = false }) {
    $('#confirm-title').textContent = title;
    $('#confirm-msg').textContent = message;
    const okBtn = $('#confirm-ok');
    okBtn.textContent = ok;
    okBtn.classList.toggle('danger', danger);
    $('#confirm').hidden = false;
    $('#confirm-cancel').focus();
    return new Promise(res => { confirmResolve = res; });
  }
  function hideConfirm(result) {
    $('#confirm').hidden = true;
    if (confirmResolve) confirmResolve(result);
    confirmResolve = null;
  }
  $('#confirm-ok').addEventListener('click', () => hideConfirm(true));
  $('#confirm-cancel').addEventListener('click', () => hideConfirm(false));
  $('#confirm').addEventListener('click', e => { if (e.target.id === 'confirm') hideConfirm(false); });

  // ---------- log out / delete ----------
  $('#logout-btn').addEventListener('click', async () => {
    const ok = await askConfirm({
      title: 'Log out?',
      message: 'Your collection stays saved on this device.',
      ok: 'Log out',
    });
    if (!ok) return;
    try { localStorage.removeItem('lalaangan.session'); } catch {}
    notifyParent('logout');
  });

  $('#delete-btn').addEventListener('click', async () => {
    const ok = await askConfirm({
      title: 'Delete account?',
      message: 'This erases your creatures, steps, rewards and settings. It can’t be undone.',
      ok: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('lalaangan'))
        .forEach(k => localStorage.removeItem(k));
    } catch {}
    notifyParent('delete-account');
  });
})();