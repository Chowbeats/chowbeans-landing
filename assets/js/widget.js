/* Apply / Sign in tabs for the two SocialLadder widgets, plus the listener
   that feeds the rail engine.

   Each panel mounts on first open — loading both up front would pull in two
   full portals. Once mounted a panel is only hidden, never torn down, so
   switching back keeps any session the widget established. */
(function () {
  'use strict';

  var cfg = window.SL_CONFIG || {};
  var Rail = window.Rail;

  /* The loader forwards this into the widget URL, so the portal comes up in
     the same language as the page. */
  function slLang() {
    var lang = (window.I18N && window.I18N.lang) || 'en';
    return (cfg.langCodes && cfg.langCodes[lang]) || lang;
  }

  function t(key, fallback) {
    return (window.I18N && window.I18N.t(key)) || fallback;
  }

  /* ── Phones get pointed at the app ──────────────────────────────────
     The application form is fine in a mobile browser, so Apply is left
     alone. The ambassador portal is not, so signing in on a phone offers
     the store first and only mounts the portal if the visitor insists.
     Append ?mobile=1 to force this path on a desktop for testing. */

  var STORES = {
    ios: 'https://apps.apple.com/br/app/community-by-socialladder/id6670606352',
    android: 'https://play.google.com/store/apps/details?id=com.socialladdergen3'
  };

  var SEEN = 'chowbeans.webok';

  /* iPadOS reports itself as a Mac, hence the touch-point check. */
  function iPadish() {
    return /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
  }

  function platform() {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent) || iPadish()) return 'ios';
    if (/Android/i.test(navigator.userAgent)) return 'android';
    return null;
  }

  function isPhone() {
    if (/[?&]mobile=1/.test(location.search)) return true;
    if (platform()) return true;
    if (/Windows Phone|Mobile/i.test(navigator.userAgent)) return true;
    return window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 900;
  }

  var panel = document.getElementById('panel-login');
  if (!panel || typeof loadSLWebFrame !== 'function') return;

  if (Rail) Rail.init();

  var mounted = false;

  function mount() {
    if (mounted) return;
    mounted = true;

    watchPlaceholder(panel, document.getElementById('slWebFrame'));

    loadSLWebFrame(
      cfg.areaGuid,
      '',
      getParameterFromURLByName('campGuid'),
      getParameterFromURLByName('resGuid'),
      getParameterFromURLByName('resetToken'),
      slLang()
    );
  }

  /* Hide a panel's placeholder as soon as the widget puts something in it. */
  function watchPlaceholder(panel, host) {
    var loading = panel.querySelector('.widget-loading');
    if (!loading) return;

    var settled = false;
    var finish = function () {
      if (settled) return;
      settled = true;
      loading.hidden = true;
    };

    if (host.childElementCount > 0) { finish(); return; }

    if ('MutationObserver' in window) {
      var mo = new MutationObserver(function () {
        if (host.childElementCount === 0) return;
        mo.disconnect();
        finish();
      });
      mo.observe(host, { childList: true });
    }

    var elapsed = 0;
    var poll = setInterval(function () {
      elapsed += 500;
      if (host.childElementCount > 0) { clearInterval(poll); finish(); return; }
      if (elapsed >= 15000) {
        clearInterval(poll);
        loading.innerHTML = '<p class="label">This could not be loaded</p>';
      }
    }, 500);
  }

  /* ── App modal ──────────────────────────────────────────────────── */

  var modal = document.getElementById('appModal');
  var advice = document.getElementById('webAdvice');
  var prompt = document.getElementById('appPrompt');
  var lastFocus = null;

  function storeUrl() {
    return STORES[platform()] || STORES.ios;
  }

  function setUpStoreLinks() {
    var os = platform();
    var primary = document.getElementById('storePrimary');
    var secondary = document.getElementById('storeSecondary');
    var adviceLink = document.getElementById('adviceLink');

    if (os) {
      primary.href = STORES[os];
      primary.textContent = os === 'ios'
        ? t('modal.ios', 'Get it on the App Store')
        : t('modal.android', 'Get it on Google Play');
    } else {
      /* Unknown device — offer both rather than guessing. */
      primary.href = STORES.ios;
      primary.textContent = t('modal.ios.short', 'App Store');
      secondary.href = STORES.android;
      secondary.textContent = t('modal.android.short', 'Google Play');
      secondary.hidden = false;
    }
    if (adviceLink) adviceLink.href = storeUrl();
  }

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('is-locked');
    document.getElementById('storePrimary').focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('is-locked');
    if (lastFocus) lastFocus.focus();
  }

  /* Dismissing without choosing leaves a way back in, rather than stranding
     the visitor looking at an empty panel. */
  function dismissModal() {
    closeModal();
    if (!mounted && prompt) prompt.hidden = false;
  }

  if (modal) {
    setUpStoreLinks();

    modal.addEventListener('click', function (event) {
      if (event.target.closest('[data-close]')) dismissModal();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) dismissModal();
    });

    document.getElementById('stayOnWeb').addEventListener('click', function () {
      try { sessionStorage.setItem(SEEN, '1'); } catch (e) {}
      closeModal();
      if (advice) advice.hidden = false;
      if (prompt) prompt.hidden = true;

      /* The placeholder was hidden while the modal stood in for it. */
      var loading = panel.querySelector('.widget-loading');
      if (loading) loading.hidden = false;

      mount();
    });

    var reopen = document.getElementById('showAppOptions');
    if (reopen) reopen.addEventListener('click', function (event) {
      event.preventDefault();
      openModal();
    });
  }

  function accepted() {
    try { return sessionStorage.getItem(SEEN) === '1'; } catch (e) { return false; }
  }

  /* ── Portal bridge ──────────────────────────────────────────────────
     The dashboard posts its state to this window (the same messages the
     loader's own bridge consumes — listeners are additive, so reading them
     here changes nothing). We translate those into a view + item name and
     hand them to the rail engine, which decides what to show.

     The application widget posts nothing at all, so the apply tab only ever
     reports the 'apply' view. */

  var SL_ORIGIN = 'https://socialladder.rkiapps.com';

  /* Detail views carry the item's own name in the page title. */
  var DETAIL = { challenge: 1, reward: 1, thread: 1 };

  var section = null;

  /* 'community/classic' and 'chat#thread-3' both resolve to their base view. */
  function sectionOf(routerLink) {
    return String(routerLink).split('#')[0].split('/')[0];
  }

  /* The portal's title is a breadcrumb joined by ' - ', ' | ' and friends;
     the last leaf is the specific thing being viewed. */
  function leafOf(title) {
    var parts = String(title).split(/\s[-—:;.|_]\s/);
    var leaf = parts[parts.length - 1].trim();
    return leaf.length > 1 && leaf.length < 60 ? leaf : '';
  }

  function onSection(routerLink) {
    var key = sectionOf(routerLink);
    var fragment = String(routerLink).split('#')[1];
    var moved = key !== section;

    if (fragment) Rail.note('item: ' + fragment);

    /* Drilling in fires this too — don't wipe a named item with its section. */
    if (!moved && fragment) return;

    section = key;
    Rail.setContext({ view: key, item: '' });
    if (moved) Rail.note('view: ' + key);
  }

  function onTitle(title) {
    var leaf = leafOf(title);
    if (!leaf) return;

    Rail.note('title: ' + leaf);
    if (DETAIL[section]) Rail.setContext({ item: leaf });
  }

  if (Rail) window.addEventListener('message', function (event) {
    if (event.origin !== SL_ORIGIN) return;

    var msg = event.data;
    if (!msg || typeof msg.action !== 'string') return;

    switch (msg.action) {
      case 'communityAuthenticated':
        Rail.setAuth(true);
        Rail.note('signed in');
        break;
      case 'communityAuthRequired':
        Rail.setAuth(false);
        Rail.note('sign-in required');
        break;
      case 'activeRouterLink':
        if (typeof msg.routerLink === 'string') onSection(msg.routerLink);
        break;
      case 'updateBrowserHistory':
        if (typeof msg.routerLink === 'string') onSection(msg.routerLink);
        break;
      case 'updatePageTitle':
        if (typeof msg.title === 'string') onTitle(msg.title);
        break;
      case 'loaded':
        Rail.note('portal loaded');
        break;
    }
  }, false);

  if (Rail) Rail.setContext({ view: 'signin', item: '' });

  /* Hold the portal back on a phone until they choose app or web. */
  if (modal && isPhone() && !accepted()) {
    var loading = panel.querySelector('.widget-loading');
    if (loading) loading.hidden = true;
    openModal();
  } else {
    mount();
  }
})();
