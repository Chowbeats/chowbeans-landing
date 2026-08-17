/* ============================================================
   English / Spanish.

   English lives in the markup; this file only carries the Spanish.
   Elements opt in with data-i18n="key" (text) or data-i18n-html="key"
   (small trusted fragments from the dictionary below).

   Language comes from ?lang=, then localStorage, then English. Email
   campaigns can therefore link straight to ?lang=es or ?lang=en.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'chowbeans.lang';
  var LANGS = ['en', 'es'];

  var ES = {
    /* Chrome */
    'nav.coffee': 'Café',
    'nav.community': 'Comunidad',
    'nav.program': 'Programa',
    'footer.hours': '4-2-9 Nakameguro, Tokio · Lun a Vie 07:00 a 18:00',
    'footer.fine': 'Chowbeans, una tostaduría ficticia.',
    'skip': 'Ir al contenido',

    /* Landing */
    'home.title': 'Café, reducido a <span>lo esencial.</span>',
    'home.lede': 'Doce fincas. Un tostador. Lotes pequeños, tueste claro y servidos dentro de los nueve días siguientes a la tanda.',
    'home.amb.label': 'Embajadores',
    'home.amb.title': 'Las personas que sirven por nosotros',
    'home.amb.body': 'Comparte la tanda, trae gente al bar, gana granos y acceso anticipado a cada microlote.',
    'home.amb.details': 'Detalles del programa',
    'home.week.title': 'Esta semana',
    'home.week.label': 'Tres lotes',
    'bean.1.notes': 'Bergamota, durazno blanco, jazmín',
    'bean.2.notes': 'Manzana roja, panela, cacao suave',
    'bean.3.notes': 'Nuez de Brasil, caramelo oscuro, redondo',

    /* Shared actions */
    'btn.apply': 'Postular',
    'btn.signin': 'Iniciar sesión',

    /* Community */
    'comm.label': 'Embajadores',
    'comm.title': 'Sirve para la sala.',
    'comm.lede': 'Comparte tu enlace, trae gente al bar y acumula granos por cada taza que empiece contigo.',
    'comm.loading': 'Cargando',
    'comm.failed': 'No se pudo cargar',
    'comm.advice': 'Estás en la versión web. La app funciona mejor en el teléfono,',
    'comm.advice.link': 'consíguela aquí',

    /* App modal */
    'modal.label': 'Embajadores',
    'modal.title': 'Mejor en la app',
    'modal.body': 'En el teléfono, la comunidad funciona mejor en la app Community by SocialLadder: retos, recompensas y notificaciones sin el navegador de por medio.',
    'modal.ios': 'Descargar en el App Store',
    'modal.android': 'Descargar en Google Play',
    'modal.ios.short': 'App Store',
    'modal.android.short': 'Google Play',
    'modal.stay': 'Continuar en este navegador',
    'modal.fine': 'La versión web funciona, pero no es la mejor experiencia en una pantalla pequeña.',
    'modal.close': 'Cerrar',

    /* Program details */
    'pd.label': 'Programa de embajadores',
    'pd.doc.title': 'Detalles del programa. Embajadores de Chowbeans',
    'pd.lede': 'Chowbeans crece de boca en boca y nada más. Los embajadores comparten la tanda, traen gente al bar y ganan granos por cada taza que empieza con ellos. Así funciona exactamente.',

    'pd.get.title': 'Qué recibes',
    'pd.get.label': 'Cuatro cosas',
    'pd.get.1.h': 'Granos por cada referido',
    'pd.get.1.p': 'Quien compre con tu enlace te da granos. Y sigue dándolos después del primer pedido.',
    'pd.get.2.h': 'Acceso anticipado a microlotes',
    'pd.get.2.p': 'Los lotes pequeños se agotan en una mañana. Los embajadores los ven un día antes que el público.',
    'pd.get.3.h': 'Un lugar en la cata',
    'pd.get.3.p': 'Catamos lo que llega los sábados. Los lugares son limitados y se reservan con granos.',
    'pd.get.4.h': 'Equipo de la estantería',
    'pd.get.4.p': 'Molinos, goteadores, balanzas. El mismo equipo que usamos en el bar, no artículos de marca.',

    'pd.beans.title': 'Cómo funcionan los granos',
    'pd.earn': 'Ganar',
    'pd.spend': 'Gastar',
    'pd.earn.1': 'Alguien compra con tu enlace',
    'pd.earn.2': 'Traes a alguien al bar',
    'pd.earn.3': 'Publicas una preparación y nos etiquetas',
    'pd.earn.4': 'Completas un reto de preguntas',
    'pd.spend.1': 'Una bolsa de la tanda actual',
    'pd.spend.2': 'Un lugar en la cata del sábado',
    'pd.spend.3': 'Un molino manual de la estantería',
    'pd.beans.50': '50 granos',
    'pd.beans.30': '30 granos',
    'pd.beans.20': '20 granos',
    'pd.beans.250': '250 granos',
    'pd.beans.400': '400 granos',
    'pd.beans.900': '900 granos',

    'pd.who.title': 'Para quién es',
    'pd.who.label': 'Requisitos',
    'pd.who.1.h': 'Sin mínimo de seguidores',
    'pd.who.1.p': 'Nunca hemos mirado ese número. Traer a cuatro personas que se quedan vale más que cuatro mil que pasan de largo.',
    'pd.who.2.h': 'Donde podamos enviar',
    'pd.who.2.p': 'Si podemos hacerte llegar una bolsa, puedes ser embajador. El bar está en Tokio, el programa no.',
    'pd.who.3.h': 'Mayor de dieciocho',
    'pd.who.3.p': 'Necesitas tener dieciocho años para abrir una cuenta y para reclamar lo que haya en ella.',

    'pd.rules.title': 'Reglas de la casa',
    'pd.rules.label': 'Versión corta',
    'pd.rules.1': 'Una cuenta por persona.',
    'pd.rules.2': 'Recomienda solamente lo que hayas probado.',
    'pd.rules.3': 'Nada de publicidad pagada sobre el nombre Chowbeans.',
    'pd.rules.4': 'Los granos vencen doce meses después de ganarlos.',
    'pd.rules.5': 'Cerramos las cuentas que abusan del programa. Ha pasado dos veces.',

    'pd.join.title': 'Cómo entrar',
    'pd.join.label': 'Tres pasos',
    'pd.join.1.h': 'Postula',
    'pd.join.1.p': 'Un formulario corto. Datos de contacto y algunas preguntas sobre cómo tomas café.',
    'pd.join.2.h': 'Respuesta en una semana',
    'pd.join.2.p': 'Una persona lee cada postulación. Tostamos los martes y revisamos los miércoles.',
    'pd.join.3.h': 'Recibe tu enlace',
    'pd.join.3.p': 'Se emite el día de la aprobación, junto con tus primeros retos.',

    'pd.cta.label': 'Listo',
    'pd.cta.title': 'Únete al bar',
    'pd.cta.body': 'Postular toma alrededor de un minuto. Si ya eres embajador, inicia sesión para retomar tus retos y granos.'
  };

  var DICT = { es: ES };

  /* English is whatever the markup shipped with. */
  var original = new Map();

  function read(name) {
    try { return localStorage.getItem(name); } catch (e) { return null; }
  }

  function write(name, value) {
    try { localStorage.setItem(name, value); } catch (e) {}
  }

  function requested() {
    var param = new URLSearchParams(location.search).get('lang');
    if (param && LANGS.indexOf(param.toLowerCase()) !== -1) return param.toLowerCase();
    var saved = read(KEY);
    if (saved && LANGS.indexOf(saved) !== -1) return saved;
    return 'en';
  }

  var lang = requested();

  function apply() {
    var table = DICT[lang] || {};

    document.querySelectorAll('[data-i18n], [data-i18n-html]').forEach(function (node) {
      var html = node.hasAttribute('data-i18n-html');
      var key = node.getAttribute(html ? 'data-i18n-html' : 'data-i18n');

      if (!original.has(node)) {
        original.set(node, html ? node.innerHTML : node.textContent);
      }

      var value = table[key];
      var fallback = original.get(node);

      if (html) node.innerHTML = value || fallback;
      else node.textContent = value || fallback;
    });

    /* Attributes: data-i18n-attr="aria-label:modal.close" */
    document.querySelectorAll('[data-i18n-attr]').forEach(function (node) {
      node.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var bits = pair.split(':');
        var attr = bits[0].trim();
        var key = bits[1].trim();
        var memo = 'i18n:' + attr;

        if (!original.has(node.getAttributeNode(attr) || node)) {
          if (!node.dataset[memo]) node.dataset[memo] = node.getAttribute(attr) || '';
        }
        node.setAttribute(attr, (table[key] || node.dataset[memo] || ''));
      });
    });

    document.documentElement.lang = lang;

    document.querySelectorAll('[data-lang]').forEach(function (button) {
      button.setAttribute('aria-pressed', button.dataset.lang === lang ? 'true' : 'false');
    });
  }

  /* A mounted SocialLadder widget cannot be re-languaged in place, so reload
     with the parameter and let the loader mount it in the new language. */
  function widgetMounted() {
    return ['slWebAppWidget', 'slWebFrame'].some(function (id) {
      var node = document.getElementById(id);
      return node && node.childElementCount > 0;
    });
  }

  function set(next) {
    if (LANGS.indexOf(next) === -1 || next === lang) return;
    lang = next;
    write(KEY, next);

    var url = new URL(location.href);
    url.searchParams.set('lang', next);

    if (widgetMounted()) { location.href = url.toString(); return; }

    history.replaceState(null, '', url);
    apply();
  }

  window.I18N = {
    get lang() { return lang; },
    set: set,
    t: function (key) { return (DICT[lang] || {})[key]; }
  };

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-lang]');
    if (button) set(button.dataset.lang);
  });

  apply();
})();
