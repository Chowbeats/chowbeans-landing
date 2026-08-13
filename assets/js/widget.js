/* Apply / Sign in tabs for the two SocialLadder widgets.
   Each panel mounts on first open — loading both up front would pull in two
   full portals. Once mounted a panel is only hidden, never torn down, so
   switching back keeps any session the widget established. */
(function () {
  'use strict';

  var cfg = window.SL_CONFIG || {};

  var VIEWS = {
    apply: {
      tab: 'tab-apply',
      panel: 'panel-apply',
      mount: function () {
        var appGuid = getParameterFromURLByName('appGuid') || cfg.defaultAppGuid;
        loadSLApplicationWidget(
          cfg.areaGuid,
          appGuid,
          '',
          '',
          getParameterFromURLByName('campGuid'),
          cfg.crmShopName,
          getParameterFromURLByName('resGuid')
        );
      }
    },
    login: {
      tab: 'tab-login',
      panel: 'panel-login',
      mount: function () {
        loadSLWebFrame(
          cfg.areaGuid,
          '',
          getParameterFromURLByName('campGuid'),
          getParameterFromURLByName('resGuid'),
          getParameterFromURLByName('resetToken')
        );
      }
    }
  };

  var tabs = document.querySelector('.tabs');
  if (!tabs || typeof loadSLApplicationWidget !== 'function') return;

  var order = ['apply', 'login'];
  var mounted = {};
  var current = null;

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

  function show(name) {
    if (name === current) return;

    order.forEach(function (key) {
      var view = VIEWS[key];
      var tab = document.getElementById(view.tab);
      var panel = document.getElementById(view.panel);
      var on = key === name;

      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      panel.hidden = !on;
    });

    current = name;
    section = null;
    setContext(name === 'login' ? LOGIN_COPY : APPLY_COPY);
    setSteps(name === 'login' ? null : 'apply');
    setTraining(null);
    if (name === 'apply') setStatus('Not signed in', '');

    if (!mounted[name]) {
      mounted[name] = true;
      var view = VIEWS[name];
      var panel = document.getElementById(view.panel);
      var host = panel.querySelector('#slWebAppWidget, #slWebFrame');
      watchPlaceholder(panel, host);
      view.mount();
    }
  }

  tabs.addEventListener('click', function (event) {
    var tab = event.target.closest('[role="tab"]');
    if (!tab) return;
    show(tab.id === 'tab-login' ? 'login' : 'apply');
  });

  tabs.addEventListener('keydown', function (event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    var next = order[(order.indexOf(current) + 1) % order.length];
    show(next);
    document.getElementById(VIEWS[next].tab).focus();
  });

  /* ── Context rail ───────────────────────────────────────────────────
     The dashboard posts its state to this window (the same messages the
     loader's own bridge consumes — listeners are additive, so reading them
     here changes nothing). The application widget posts nothing at all, so
     that tab gets static copy rather than a fake live readout. */

  var SL_ORIGIN = 'https://socialladder.rkiapps.com';

  /* Singular keys are the detail views — the portal routes a specific
     challenge to 'challenge', not 'challenges'. */
  var SECTIONS = {
    'challenge': ['Challenge', 'Work through the brief, submit, and the beans land once we verify.'],
    'reward': ['Reward', 'Confirm to spend your beans. Collect at the bar or on the next roast day.'],
    'thread': ['Thread', 'Pick up the conversation where the bar left off.'],
    'dashboard': ['Dashboard', 'Beans land here the moment a referral is credited.'],
    'conversion-tracking': ['Refer a friend', 'Your link works anywhere — in store, in a DM, on a bag.'],
    'challenges': ['Challenges', 'Each one pays in beans. New challenges drop with the Tuesday roast.'],
    'rewards': ['Rewards', 'Trade beans for bags, gear, or a seat at the next cupping.'],
    'community': ['Community', 'See who else is pouring. The leaderboard resets monthly.'],
    'chat': ['Chat', 'Talk to the roaster. We answer between pours.'],
    'threads': ['Threads', 'Longer conversations with the rest of the bar.'],
    'notifications': ['Notifications', 'Challenge results, reward approvals and replies.'],
    'settings': ['Settings', 'Payout details, socials and how we reach you.']
  };

  /* Onboarding shown alongside the sections that need explaining. */
  var STEPS = {
    'apply': [
      'Contact details and how we reach you.',
      'A few questions about how you drink coffee.',
      'Agree to terms and submit.'
    ],
    'challenges': [
      'Open a challenge to read the brief and what it pays.',
      'Do the thing — post, refer a friend, or answer the quiz.',
      'Submit. Beans land once we verify, usually within a day.'
    ],
    'challenge': [
      'Read the brief and check what it pays.',
      'Work through the training material before you start.',
      'Submit once. Answers are final on quiz challenges.'
    ],
    'conversion-tracking': [
      'Copy your personal link.',
      'Share it anywhere — in store, in a DM, on a bag.',
      'Every order that starts with your link credits you.'
    ],
    'rewards': [
      'Check your bean balance at the top.',
      'Pick a reward and confirm.',
      'Collect at the bar, or we ship it on the next roast day.'
    ]
  };

  /* Training material shown when a specific challenge is open. Keys are the
     challenge name lowercased with trailing punctuation stripped; '*' is the
     fallback for anything not listed. Placeholder hrefs — swap for real ones. */
  var TRAINING = {
    'take the quiz': [
      ['Extraction, in one page', '#'],
      ['Our twelve origins', '#'],
      ['How to describe a cup', '#'],
      ['Quiz rules and scoring', '#']
    ],
    '*': [
      ['Ambassador training: start here', '#'],
      ['Brand voice and tone', '#'],
      ['Photo and posting rules', '#'],
      ['What a bean is worth', '#']
    ]
  };

  var APPLY_COPY = ['Applying', 'Join the bar',
    'A short form, then we review. Approval lands by email, usually the same week.'];

  var LOGIN_COPY = ['Signing in', 'Your bar',
    'Sign in to pick up your challenges, beans and standing. This panel follows ' +
    'along as you move through the portal.'];

  var rail = {
    statusText: document.getElementById('railStatusText'),
    status: document.getElementById('railStatus'),
    label: document.getElementById('railContextLabel'),
    title: document.getElementById('railTitle'),
    body: document.getElementById('railBody'),
    countsBlock: document.getElementById('railCountsBlock'),
    counts: document.getElementById('railCounts'),
    stepsBlock: document.getElementById('railStepsBlock'),
    steps: document.getElementById('railSteps'),
    trainingBlock: document.getElementById('railTrainingBlock'),
    training: document.getElementById('railTraining'),
    feed: document.getElementById('railFeed')
  };

  var counts = {};
  var section = null;

  function setStatus(text, state) {
    if (!rail.statusText) return;
    rail.statusText.textContent = text;
    rail.status.dataset.state = state || '';
  }

  function setContext(copy) {
    if (!rail.title) return;
    rail.label.textContent = copy[0];
    rail.title.textContent = copy[1];
    rail.body.textContent = copy[2];
  }

  function note(text) {
    if (!rail.feed) return;
    var empty = rail.feed.querySelector('.rail-empty');
    if (empty) empty.remove();

    var time = new Date().toTimeString().slice(0, 8);
    var li = document.createElement('li');
    li.innerHTML = '<span>' + time + '</span>';
    li.appendChild(document.createTextNode(text));
    rail.feed.prepend(li);

    while (rail.feed.children.length > 6) rail.feed.lastElementChild.remove();
  }

  function renderCounts() {
    var keys = Object.keys(counts).filter(function (k) { return counts[k] > 0; });
    rail.countsBlock.hidden = keys.length === 0;
    rail.counts.innerHTML = '';
    keys.forEach(function (k) {
      var li = document.createElement('li');
      li.textContent = k;
      var b = document.createElement('b');
      b.textContent = counts[k];
      li.appendChild(b);
      rail.counts.appendChild(li);
    });
  }

  function setSteps(key) {
    var steps = STEPS[key];
    rail.stepsBlock.hidden = !steps;
    if (!steps) return;
    rail.steps.innerHTML = '';
    steps.forEach(function (text) {
      var li = document.createElement('li');
      li.appendChild(document.createTextNode(text));
      rail.steps.appendChild(li);
    });
  }

  function setTraining(name) {
    if (!rail.trainingBlock) return;

    if (!name) { rail.trainingBlock.hidden = true; return; }

    var key = name.toLowerCase().replace(/[!?.\s]+$/, '');
    var links = TRAINING[key] || TRAINING['*'];

    rail.training.innerHTML = '';
    links.forEach(function (link) {
      var a = document.createElement('a');
      a.href = link[1];
      a.textContent = link[0];
      var li = document.createElement('li');
      li.appendChild(a);
      rail.training.appendChild(li);
    });
    rail.trainingBlock.hidden = false;
  }

  /* 'community/classic' and 'chat#thread-3' both resolve to their base view. */
  function sectionOf(routerLink) {
    return String(routerLink).split('#')[0].split('/')[0];
  }

  /* The portal's own title is a breadcrumb joined by ' - ', ' : ' and friends;
     the last leaf is the specific thing being viewed (a challenge name, say). */
  function leafOf(title) {
    var parts = String(title).split(/\s[-—:;.|_]\s/);
    var leaf = parts[parts.length - 1].trim();
    return leaf.length > 1 && leaf.length < 60 ? leaf : '';
  }

  /* Detail views the portal routes to a singular name — these are the ones
     whose page title carries the item's own name. */
  var DETAIL = { challenge: 1, reward: 1, thread: 1 };

  function onSection(routerLink, pageTitle) {
    var key = sectionOf(routerLink);
    var known = SECTIONS[key];
    var fragment = String(routerLink).split('#')[1];
    var moved = key !== section;

    section = key;
    if (fragment) note('Item: ' + fragment);

    /* Drilling in fires this too — don't overwrite a named item with its
       section heading. */
    if (!moved && fragment) return;

    setSteps(key);
    if (!DETAIL[key]) setTraining(null);

    setContext(known
      ? [DETAIL[key] ? known[0] : 'Viewing', known[0], known[1]]
      : ['Viewing', leafOf(pageTitle) || pageTitle || key, 'Moving through the portal.']);
    if (moved) note((known ? known[0] : key) + ' opened');
  }

  /* The portal sends the item's own name as a page title once the detail view
     opens ("… - Take the quiz!"). That name is the only handle we get on which
     challenge it is, so it drives both the heading and the training links. */
  function onTitle(title) {
    var leaf = leafOf(title);
    if (!leaf) return;

    note('Title: ' + leaf);

    var known = SECTIONS[section];
    var label = known ? known[0] : 'Viewing';
    var body = known ? known[1] : 'Moving through the portal.';

    /* An intermediate title equal to the section name isn't an item name. */
    if (known && leaf.toLowerCase() === known[0].toLowerCase()) return;

    setContext([label, leaf, body]);
    if (DETAIL[section]) setTraining(leaf);
  }

  window.addEventListener('message', function (event) {
    if (event.origin !== SL_ORIGIN) return;

    var msg = event.data;
    if (!msg || typeof msg.action !== 'string') return;

    switch (msg.action) {
      case 'communityAuthenticated':
        setStatus('Signed in', 'on');
        note('Signed in');
        break;
      case 'communityAuthRequired':
        setStatus('Sign-in required', 'warn');
        note('Sign-in required');
        break;
      case 'loaded':
        if (current === 'login') setStatus('Portal ready', 'on');
        note('Portal loaded');
        break;
      case 'activeRouterLink':
        if (typeof msg.routerLink === 'string') onSection(msg.routerLink);
        break;
      case 'updateBrowserHistory':
        if (typeof msg.routerLink === 'string') onSection(msg.routerLink, msg.pageTitle);
        break;
      case 'updatePageTitle':
        if (typeof msg.title === 'string') onTitle(msg.title);
        break;
      case 'newNotifications':
        counts['Notifications'] = msg.count; renderCounts();
        break;
      case 'newChatNotifications':
        counts['Chat'] = msg.count; renderCounts();
        break;
      case 'newCommunityNotifications':
        counts['Community'] = msg.count; renderCounts();
        break;
      case 'testMode':
        setStatus('Test mode', 'warn');
        break;
      case 'dialogOpened':
        note('Dialog opened');
        break;
    }
  }, false);

  /* A reset link, an explicit ?view=login, or a saved session opens sign-in. */
  var requested = (getParameterFromURLByName('view') || '').toLowerCase();
  var startOnLogin = requested === 'login' ||
                     requested === 'signin' ||
                     !!getParameterFromURLByName('resetToken');

  show(startOnLogin ? 'login' : 'apply');
})();
