/* ==========================================================================
   Lalaangan — opens Settings (settings.html) as a popup layer over the screen
   Usage: put data-open-settings on a button, or call Lalaangan.openSettings().
   settings.html runs inside an iframe and talks back with postMessage
   (see notifyParent in js/settings.js).
   ========================================================================== */
(function () {
  var frame = null;
  var opener = null;   /* button that opened it, to give focus back */

  function open() {
    if (frame) return;
    opener = document.activeElement;

    frame = document.createElement('iframe');
    frame.src = 'settings.html';
    frame.title = 'Settings';
    /* Inside the phone frame when there is one, else the whole window */
    var host = document.querySelector('.shell') || document.body;
    frame.style.cssText =
      'position:' + (host === document.body ? 'fixed' : 'absolute') + ';' +
      'inset:0;width:100%;height:100%;border:0;z-index:50;background:transparent;';
    frame.setAttribute('allowtransparency', 'true');
    frame.addEventListener('load', function () { frame && frame.focus(); });
    host.appendChild(frame);
  }

  function close() {
    if (!frame) return;
    frame.remove();
    frame = null;
    if (opener && opener.focus) opener.focus();
  }

  window.addEventListener('message', function (event) {
    if (!frame || event.source !== frame.contentWindow) return;
    var data = event.data || {};
    if (data.source !== 'lalaangan-settings') return;

    switch (data.type) {
      case 'close':
        close();
        break;
      case 'logout':
      case 'delete-account':
        /* reload the whole app (outer page), not just this screen */
        (window.top || window).location.href = 'index.html';
        break;
      case 'change':
        /* Other code can react, e.g. mute music:
           document.addEventListener('lalaangan:settings', e => e.detail.key ...) */
        document.dispatchEvent(new CustomEvent('lalaangan:settings', {
          detail: { key: data.key, value: data.value }
        }));
        break;
    }
  });

  document.addEventListener('click', function (event) {
    if (event.target.closest('[data-open-settings]')) open();
  });

  window.Lalaangan = window.Lalaangan || {};
  window.Lalaangan.openSettings = open;
  window.Lalaangan.closeSettings = close;
})();
