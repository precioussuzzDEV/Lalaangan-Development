/* ==========================================================================
   Lalaangan — level + day streak bar (shared by every screen except Profile)
   Markup: any element with data-status="level" or data-status="streak".
   The values live here only, so every page shows the same numbers.
   Later, call Lalaangan.setStatus({ level: 6 }) from real progress code:
   it saves and updates the page, and other pages pick it up when opened.
   ========================================================================== */
(function () {
  /* Placeholder values. Replace with real saved progress later. */
  var DEFAULTS = { level: 5, streak: 5 };
  var KEY = 'lalaangan_status';

  function load() {
    var status = { level: DEFAULTS.level, streak: DEFAULTS.streak };
    try {
      var saved = JSON.parse(localStorage.getItem(KEY));
      if (saved) {
        if (saved.level != null) status.level = saved.level;
        if (saved.streak != null) status.streak = saved.streak;
      }
    } catch (e) { /* storage blocked: use defaults */ }
    return status;
  }

  function render(status) {
    var text = {
      level: 'Lv ' + status.level,
      streak: status.streak + ' day streak'
    };
    document.querySelectorAll('[data-status]').forEach(function (el) {
      el.textContent = text[el.dataset.status];
    });
  }

  function setStatus(changes) {
    var status = load();
    if (changes.level != null) status.level = changes.level;
    if (changes.streak != null) status.streak = changes.streak;
    try { localStorage.setItem(KEY, JSON.stringify(status)); } catch (e) {}
    render(status);
  }

  /* Another tab changed it: stay in sync */
  window.addEventListener('storage', function (event) {
    if (event.key === KEY) render(load());
  });

  window.Lalaangan = window.Lalaangan || {};
  window.Lalaangan.getStatus = load;
  window.Lalaangan.setStatus = setStatus;

  render(load());
})();
