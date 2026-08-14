/* ============================================================
   Rail engine.

   The context rail is data, not code. A rule says "when the visitor is
   looking at X, show these blocks". Rules are matched in order against the
   live context we read off the portal's postMessage bridge, and every
   matching rule contributes its blocks — so a general rule and a specific
   one can stack, or a rule can `stop` the ones below it.

   Config lives in localStorage once edited in admin.html; until then the
   defaults below are used. Nothing here talks to the network.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'chowbeans.rail.v1';

  /* Views the portal routes to. Singular names are detail pages, and only
     those carry an item name (a challenge title, a reward name). */
  var VIEWS = [
    'apply', 'signin',
    'dashboard', 'challenges', 'challenge', 'rewards', 'reward',
    'conversion-tracking', 'community', 'chat', 'threads', 'thread',
    'notifications', 'settings'
  ];

  var DEFAULTS = {
    version: 1,
    settings: {
      /* Views the rail is allowed to appear on. Empty means every view. */
      onlyOn: ['challenges', 'challenge', 'rewards', 'reward']
    },
    rules: [
      {
        id: 'challenges-list',
        name: 'Challenge list',
        enabled: true,
        stop: false,
        when: { views: ['challenges'], auth: 'any', match: { mode: 'any', value: '' } },
        blocks: [
          { type: 'heading', label: 'Challenges', text: 'Pick one up' },
          { type: 'text', text: 'Each challenge pays in beans. New ones drop with the Tuesday roast.' },
          { type: 'steps', label: 'How it works', items: [
            'Open a challenge to read the brief and what it pays.',
            'Do the thing — post, refer a friend, or answer the quiz.',
            'Submit. Beans land once we verify, usually within a day.'
          ] }
        ]
      },
      {
        id: 'challenge-open',
        name: 'Any open challenge',
        enabled: true,
        stop: false,
        when: { views: ['challenge'], auth: 'any', match: { mode: 'any', value: '' } },
        blocks: [
          { type: 'heading', label: 'Challenge', text: '{item}' },
          { type: 'text', text: 'Work through the brief, submit, and the beans land once we verify.' }
        ]
      },
      {
        id: 'challenge-quiz',
        name: 'Quiz challenges',
        enabled: true,
        stop: false,
        when: { views: ['challenge'], auth: 'any', match: { mode: 'contains', value: 'quiz' } },
        blocks: [
          { type: 'note', text: 'Answers are final — read the material before you start.' },
          { type: 'links', label: 'Training material', items: [
            { label: 'Extraction, in one page', url: '#' },
            { label: 'Our twelve origins', url: '#' },
            { label: 'How to describe a cup', url: '#' },
            { label: 'Quiz rules and scoring', url: '#' }
          ] }
        ]
      },
      {
        id: 'challenge-default',
        name: 'Every non-quiz challenge',
        enabled: true,
        stop: false,
        when: {
          views: ['challenge'],
          auth: 'any',
          match: { mode: 'contains', value: 'quiz', negate: true }
        },
        blocks: [
          { type: 'links', label: 'Training material', items: [
            { label: 'Ambassador training: start here', url: '#' },
            { label: 'Brand voice and tone', url: '#' },
            { label: 'Photo and posting rules', url: '#' }
          ] }
        ]
      },
      {
        id: 'rewards',
        name: 'Rewards',
        enabled: true,
        stop: false,
        when: { views: ['rewards', 'reward'], auth: 'any', match: { mode: 'any', value: '' } },
        blocks: [
          { type: 'heading', label: 'Rewards', text: 'Spend your beans' },
          { type: 'steps', label: 'How it works', items: [
            'Check your bean balance at the top.',
            'Pick a reward and confirm.',
            'Collect at the bar, or we ship it on the next roast day.'
          ] }
        ]
      },
      {
        id: 'handbook',
        name: 'Handbook (all views)',
        enabled: true,
        stop: false,
        when: { views: [], auth: 'any', match: { mode: 'any', value: '' } },
        blocks: [
          { type: 'links', label: 'Handbook', items: [
            { label: 'How challenges work', url: '#' },
            { label: 'What a bean is worth', url: '#' },
            { label: 'Ask the roaster', url: '#' }
          ] }
        ]
      }
    ]
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULTS);
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.rules)) return clone(DEFAULTS);
      parsed.settings = Object.assign({}, DEFAULTS.settings, parsed.settings || {});
      return parsed;
    } catch (e) {
      return clone(DEFAULTS);
    }
  }

  function save(config) {
    localStorage.setItem(KEY, JSON.stringify(config));
  }

  function reset() {
    localStorage.removeItem(KEY);
  }

  /* {item} and {view} are substituted anywhere text is rendered. */
  function fill(text, ctx) {
    return String(text == null ? '' : text)
      .replace(/\{item\}/g, ctx.item || '')
      .replace(/\{view\}/g, ctx.view || '');
  }

  function matches(rule, ctx) {
    if (rule.enabled === false) return false;

    var when = rule.when || {};

    if (Array.isArray(when.views) && when.views.length &&
        when.views.indexOf(ctx.view) === -1) return false;

    if (when.auth === 'in' && !ctx.signedIn) return false;
    if (when.auth === 'out' && ctx.signedIn) return false;

    var m = when.match;
    if (m && m.mode && m.mode !== 'any' && String(m.value || '').length) {
      var item = String(ctx.item || '');
      var needle = String(m.value);
      var hit = false;

      if (m.mode === 'regex') {
        try { hit = new RegExp(needle, 'i').test(item); } catch (e) { hit = false; }
      } else {
        var a = item.toLowerCase();
        var b = needle.toLowerCase();
        if (m.mode === 'equals') hit = a === b;
        else if (m.mode === 'starts') hit = a.indexOf(b) === 0;
        else if (m.mode === 'contains') hit = a.indexOf(b) !== -1;
      }

      return m.negate ? !hit : hit;
    }

    return true;
  }

  /* Every matching rule contributes blocks, in order, until one says stop. */
  function collect(config, ctx) {
    var blocks = [];
    var rules = (config && config.rules) || [];

    for (var i = 0; i < rules.length; i++) {
      if (!matches(rules[i], ctx)) continue;
      blocks = blocks.concat(rules[i].blocks || []);
      if (rules[i].stop) break;
    }
    return blocks;
  }

  function visible(config, ctx) {
    var only = (config.settings && config.settings.onlyOn) || [];
    return !only.length || only.indexOf(ctx.view) !== -1;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderBlock(block, ctx) {
    var wrap = el('div', 'rail-block' + (block.type === 'note' ? ' rail-block--accent' : ''));

    if (block.label) wrap.appendChild(el('p', 'label', fill(block.label, ctx)));

    if (block.type === 'heading') {
      wrap.appendChild(el('h3', null, fill(block.text, ctx)));

    } else if (block.type === 'text' || block.type === 'note') {
      wrap.appendChild(el('p', null, fill(block.text, ctx)));

    } else if (block.type === 'steps') {
      var ol = el('ol', 'rail-steps');
      (block.items || []).forEach(function (item) {
        ol.appendChild(el('li', null, fill(item, ctx)));
      });
      wrap.appendChild(ol);

    } else if (block.type === 'links') {
      var ul = el('ul', 'rail-links');
      (block.items || []).forEach(function (item) {
        var a = el('a', null, fill(item.label, ctx));
        a.href = fill(item.url, ctx) || '#';
        if (/^https?:/i.test(a.getAttribute('href'))) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }
        var li = document.createElement('li');
        li.appendChild(a);
        ul.appendChild(li);
      });
      wrap.appendChild(ul);
    }

    return wrap;
  }

  function renderBlocks(container, blocks, ctx) {
    container.innerHTML = '';
    blocks.forEach(function (block) {
      container.appendChild(renderBlock(block, ctx || {}));
    });
  }

  /* ── Page binding ─────────────────────────────────────────────────── */

  var config = load();
  var ctx = { view: null, item: '', signedIn: false };

  var dom = {};

  function paint() {
    if (!dom.rail) return;

    var blocks = visible(config, ctx) ? collect(config, ctx) : [];

    /* No content for this view means no rail at all — the widget takes the
       full width rather than sitting beside an empty column. */
    dom.layout.classList.toggle('widget-layout--norail', !blocks.length);
    dom.rail.hidden = !blocks.length;

    renderBlocks(dom.blocks, blocks, ctx);
  }

  var Rail = {
    KEY: KEY,
    VIEWS: VIEWS,
    defaults: function () { return clone(DEFAULTS); },
    load: load,
    save: save,
    reset: reset,
    collect: collect,
    matches: matches,
    visible: visible,
    renderBlocks: renderBlocks,

    init: function () {
      dom.rail = document.getElementById('rail');
      if (!dom.rail) return;

      dom.layout = document.querySelector('.widget-layout');
      dom.blocks = document.getElementById('railBlocks');

      /* ?debug reveals the raw event log — the way to find out what your
         portal actually sends before writing a rule against it. */
      if (/[?&]debug\b/.test(location.search)) {
        dom.debug = document.getElementById('railDebug');
        dom.feed = document.getElementById('railFeed');
        if (dom.debug) dom.debug.hidden = false;
      }
      paint();
    },

    setContext: function (next) {
      if ('view' in next) ctx.view = next.view;
      if ('item' in next) ctx.item = next.item;
      paint();
    },

    context: function () { return ctx; },

    /* Signed-in state is a rule condition, not a visible status. */
    setAuth: function (signedIn) {
      ctx.signedIn = !!signedIn;
      paint();
    },

    note: function (text) {
      if (!dom.feed) return;

      var li = document.createElement('li');
      li.appendChild(el('span', null, new Date().toTimeString().slice(0, 8)));
      li.appendChild(document.createTextNode(text));
      dom.feed.prepend(li);

      while (dom.feed.children.length > 12) dom.feed.lastElementChild.remove();
    }
  };

  window.Rail = Rail;
})();
