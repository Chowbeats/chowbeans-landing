/* Rule editor for the context rail. Everything is held in one config object;
   the DOM is re-rendered from it, and it is only persisted on Save. */
(function () {
  'use strict';

  var Rail = window.Rail;
  if (!Rail) return;

  var config = Rail.load();
  var dirty = false;

  var $ = function (id) { return document.getElementById(id); };

  var BLOCK_LABELS = {
    heading: 'Heading',
    text: 'Text',
    note: 'Callout',
    steps: 'Steps',
    links: 'Links'
  };

  function flash(message) {
    var node = $('flash');
    node.textContent = message;
    node.hidden = false;
    clearTimeout(flash.timer);
    flash.timer = setTimeout(function () { node.hidden = true; }, 2600);
  }

  function touch() {
    dirty = true;
    renderPreview();
    renderJSON();
  }

  function uid() {
    return 'r' + Math.random().toString(36).slice(2, 8);
  }

  /* ── View checkboxes ─────────────────────────────────────────────── */

  function viewChecklist(container, selected, onChange) {
    container.innerHTML = '';
    Rail.VIEWS.forEach(function (view) {
      var label = document.createElement('label');
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = selected.indexOf(view) !== -1;
      input.addEventListener('change', function () {
        var next = selected.slice();
        var at = next.indexOf(view);
        if (input.checked && at === -1) next.push(view);
        if (!input.checked && at !== -1) next.splice(at, 1);
        onChange(next);
      });
      label.appendChild(input);
      label.appendChild(document.createTextNode(view));
      container.appendChild(label);
    });
  }

  /* ── Block editors ───────────────────────────────────────────────── */

  function blockEditor(block, rule, index) {
    var wrap = document.createElement('div');
    wrap.className = 'block';

    var head = document.createElement('header');
    head.innerHTML = '<span class="block-type">' + (BLOCK_LABELS[block.type] || block.type) + '</span>';

    var tools = document.createElement('div');
    ['↑', '↓', '✕'].forEach(function (glyph, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = glyph;
      b.addEventListener('click', function () {
        var blocks = rule.blocks;
        if (i === 0 && index > 0) blocks.splice(index - 1, 0, blocks.splice(index, 1)[0]);
        if (i === 1 && index < blocks.length - 1) blocks.splice(index + 1, 0, blocks.splice(index, 1)[0]);
        if (i === 2) blocks.splice(index, 1);
        renderRules();
        touch();
      });
      tools.appendChild(b);
    });
    head.appendChild(tools);
    wrap.appendChild(head);

    wrap.appendChild(field('Caption (optional)', block.label || '', function (value) {
      block.label = value; touch();
    }));

    if (block.type === 'heading' || block.type === 'text' || block.type === 'note') {
      wrap.appendChild(field('Text', block.text || '', function (value) {
        block.text = value; touch();
      }, block.type !== 'heading'));

    } else if (block.type === 'steps') {
      wrap.appendChild(field('One step per line', (block.items || []).join('\n'), function (value) {
        block.items = value.split('\n').filter(function (line) { return line.trim(); });
        touch();
      }, true));

    } else if (block.type === 'links') {
      var lines = (block.items || []).map(function (item) {
        return item.label + ' | ' + item.url;
      }).join('\n');
      wrap.appendChild(field('One per line — label | url', lines, function (value) {
        block.items = value.split('\n').filter(function (line) {
          return line.trim();
        }).map(function (line) {
          var parts = line.split('|');
          return { label: parts[0].trim(), url: (parts[1] || '#').trim() };
        });
        touch();
      }, true));
    }

    return wrap;
  }

  function field(labelText, value, onInput, multiline) {
    var label = document.createElement('label');
    label.className = 'admin-field';
    label.appendChild(Object.assign(document.createElement('span'), { textContent: labelText }));

    var input = document.createElement(multiline ? 'textarea' : 'input');
    if (multiline) input.rows = Math.min(6, Math.max(2, String(value).split('\n').length));
    input.value = value;
    input.addEventListener('input', function () { onInput(input.value); });
    label.appendChild(input);
    return label;
  }

  /* ── Rule list ───────────────────────────────────────────────────── */

  function renderRules() {
    var host = $('rules');
    host.innerHTML = '';

    config.rules.forEach(function (rule, index) {
      var node = $('ruleTemplate').content.cloneNode(true);
      var root = node.querySelector('.rule');

      var enabled = root.querySelector('[data-field="enabled"]');
      enabled.checked = rule.enabled !== false;
      enabled.addEventListener('change', function () {
        rule.enabled = enabled.checked;
        root.classList.toggle('rule--off', !enabled.checked);
        touch();
      });
      root.classList.toggle('rule--off', rule.enabled === false);

      var name = root.querySelector('[data-field="name"]');
      name.value = rule.name || '';
      name.addEventListener('input', function () { rule.name = name.value; touch(); });

      rule.when = rule.when || {};
      rule.when.match = rule.when.match || { mode: 'any', value: '' };

      viewChecklist(root.querySelector('[data-field="views"]'), rule.when.views || [], function (next) {
        rule.when.views = next;
        touch();
      });

      var mode = root.querySelector('[data-field="matchMode"]');
      mode.value = rule.when.match.mode || 'any';
      mode.addEventListener('change', function () {
        rule.when.match.mode = mode.value; touch();
      });

      var negate = root.querySelector('[data-field="negate"]');
      negate.checked = !!rule.when.match.negate;
      negate.addEventListener('change', function () {
        rule.when.match.negate = negate.checked; touch();
      });

      var value = root.querySelector('[data-field="matchValue"]');
      value.value = rule.when.match.value || '';
      value.addEventListener('input', function () {
        rule.when.match.value = value.value; touch();
      });

      var auth = root.querySelector('[data-field="auth"]');
      auth.value = rule.when.auth || 'any';
      auth.addEventListener('change', function () { rule.when.auth = auth.value; touch(); });

      var stop = root.querySelector('[data-field="stop"]');
      stop.checked = !!rule.stop;
      stop.addEventListener('change', function () { rule.stop = stop.checked; touch(); });

      var blocks = root.querySelector('[data-field="blocks"]');
      rule.blocks = rule.blocks || [];
      rule.blocks.forEach(function (block, i) {
        blocks.appendChild(blockEditor(block, rule, i));
      });

      root.querySelectorAll('[data-add]').forEach(function (button) {
        button.addEventListener('click', function () {
          var type = button.dataset.add;
          var fresh = { type: type };
          if (type === 'steps') fresh.items = ['First step'];
          else if (type === 'links') fresh.items = [{ label: 'Link', url: '#' }];
          else fresh.text = '';
          rule.blocks.push(fresh);
          renderRules();
          touch();
        });
      });

      root.querySelectorAll('[data-act]').forEach(function (button) {
        button.addEventListener('click', function () {
          var act = button.dataset.act;
          if (act === 'up' && index > 0) {
            config.rules.splice(index - 1, 0, config.rules.splice(index, 1)[0]);
          } else if (act === 'down' && index < config.rules.length - 1) {
            config.rules.splice(index + 1, 0, config.rules.splice(index, 1)[0]);
          } else if (act === 'dup') {
            var copy = JSON.parse(JSON.stringify(rule));
            copy.id = uid();
            copy.name = (rule.name || 'Rule') + ' copy';
            config.rules.splice(index + 1, 0, copy);
          } else if (act === 'del') {
            config.rules.splice(index, 1);
          }
          renderRules();
          touch();
        });
      });

      host.appendChild(node);
    });
  }

  /* ── Preview ─────────────────────────────────────────────────────── */

  function renderPreview() {
    var ctx = {
      view: $('pvView').value,
      item: $('pvItem').value,
      signedIn: $('pvAuth').checked
    };

    var allowed = Rail.visible(config, ctx);
    var blocks = allowed ? Rail.collect(config, ctx) : [];

    Rail.renderBlocks($('preview'), blocks, ctx);

    var names = config.rules.filter(function (rule) {
      return allowed && Rail.matches(rule, ctx);
    }).map(function (rule) { return rule.name || rule.id; });

    $('pvMatched').textContent = !allowed
      ? 'Rail is hidden on this view.'
      : names.length ? 'Matched: ' + names.join(', ')
      : 'No rule matches — the rail stays hidden.';
  }

  function renderJSON() {
    $('json').value = JSON.stringify(config, null, 2);
  }

  /* ── Wiring ──────────────────────────────────────────────────────── */

  function renderAll() {
    viewChecklist($('onlyOn'), (config.settings && config.settings.onlyOn) || [], function (next) {
      config.settings.onlyOn = next;
      touch();
    });
    renderRules();
    renderPreview();
    renderJSON();
  }

  Rail.VIEWS.forEach(function (view) {
    var option = document.createElement('option');
    option.value = view;
    option.textContent = view;
    if (view === 'challenge') option.selected = true;
    $('pvView').appendChild(option);
  });
  $('pvItem').value = 'Take the quiz!';

  ['pvView', 'pvItem', 'pvAuth'].forEach(function (id) {
    $(id).addEventListener('input', renderPreview);
    $(id).addEventListener('change', renderPreview);
  });

  $('save').addEventListener('click', function () {
    Rail.save(config);
    dirty = false;
    flash('Saved. Reload the community page to see it.');
  });

  $('revert').addEventListener('click', function () {
    config = Rail.load();
    dirty = false;
    renderAll();
    flash('Reverted to the last saved rules.');
  });

  $('defaults').addEventListener('click', function () {
    config = Rail.defaults();
    renderAll();
    flash('Defaults loaded — Save to keep them.');
  });

  $('copy').addEventListener('click', function () {
    $('json').select();
    navigator.clipboard.writeText($('json').value).then(function () {
      flash('Config copied.');
    }, function () {
      flash('Select the text and copy manually.');
    });
  });

  $('apply').addEventListener('click', function () {
    try {
      var parsed = JSON.parse($('json').value);
      if (!parsed || !Array.isArray(parsed.rules)) throw new Error('needs a rules array');
      config = parsed;
      config.settings = Object.assign({ onlyOn: [] }, config.settings || {});
      renderAll();
      flash('Applied — Save to keep it.');
    } catch (e) {
      flash('That is not valid config: ' + e.message);
    }
  });

  window.addEventListener('beforeunload', function (event) {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });

  renderAll();
})();
