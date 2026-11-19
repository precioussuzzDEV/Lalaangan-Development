/* ==========================================================================
   Lalaangan — shared steps / distance / calories (Home, Map, Profile)
   Steps are the only stored number. Distance and calories are worked out
   from steps here, so every screen always agrees.
   Real tracking later: call Lalaangan.addSteps(n) and every page updates.
   ========================================================================== */
(function () {
  var KEY = 'lalaangan_activity';
  var STEP_M = 0.75;          /* metres per step */
  var KCAL_PER_STEP = 0.04;   /* rough walking estimate */
  /* Placeholder starting values. Replace with real saved progress later. */
  var DEFAULTS = { today: 2341, lifetime: 12345 };

  var data = load();
  var listeners = [];

  function load() {
    var d = { today: DEFAULTS.today, lifetime: DEFAULTS.lifetime };
    try {
      var saved = JSON.parse(localStorage.getItem(KEY));
      if (saved) {
        if (saved.today != null) d.today = saved.today;
        if (saved.lifetime != null) d.lifetime = saved.lifetime;
      }
    } catch (e) { /* storage blocked: use defaults */ }
    return d;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  function derive(steps) {
    return {
      steps: Math.round(steps),
      distanceKm: steps * STEP_M / 1000,
      calories: Math.round(steps * KCAL_PER_STEP)
    };
  }

  function notify() {
    var snap = { today: derive(data.today), lifetime: derive(data.lifetime) };
    listeners.forEach(function (fn) { fn(snap); });
  }

  var lastSave = 0;
  function addSteps(n) {
    if (!(n > 0)) return;
    data.today += n;
    data.lifetime += n;
    var now = Date.now();
    if (now - lastSave > 1000) { save(); lastSave = now; } /* avoid writing every frame */
    notify();
  }

  window.addEventListener('pagehide', save);
  window.addEventListener('storage', function (event) {
    if (event.key === KEY) { data = load(); notify(); }
  });

  window.Lalaangan = window.Lalaangan || {};
  window.Lalaangan.getActivity = function () {
    return { today: derive(data.today), lifetime: derive(data.lifetime) };
  };
  /* Daily step goal: one fixed number shared by Home and Map */
  var STEP_GOAL = 5000;
  window.Lalaangan.getStepGoal = function () { return STEP_GOAL; };
  window.Lalaangan.stepsToKm = function (n) { return n * STEP_M / 1000; };
  window.Lalaangan.addSteps = addSteps;
  window.Lalaangan.onActivity = function (fn) { listeners.push(fn); };
})();
