/* Tells a host app that the application flow finished.

   Two paths, because only one can apply at a time:
     - inside a WebView, post a message the native side can read
     - in the system browser, offer a link back into the app

   Any identifying parameters SocialLadder appended to the redirect are
   passed along so the app knows who to check on. Treat all of it as a
   hint: verify server-side before granting anything. */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);

  var payload = {
    source: 'chowbeans',
    type: 'application-complete',
    at: new Date().toISOString(),
    /* Whatever the redirect carried — resGuid, email, campGuid, and so on. */
    params: Object.fromEntries(params.entries())
  };

  var inWebView = !!(window.ReactNativeWebView && window.ReactNativeWebView.postMessage);

  if (inWebView) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      var handoff = document.getElementById('handoff');
      if (handoff) handoff.hidden = false;
    } catch (e) {}
    return;
  }

  /* System browser: the app has to be reopened by a link. A universal link
     is better than a custom scheme, but either can be set in APP_LINK. */
  var link = window.APP_LINK;
  if (!link) return;

  var url = link + (link.indexOf('?') === -1 ? '?' : '&') + params.toString();

  var button = document.getElementById('returnToApp');
  if (button) {
    button.href = url;
    button.hidden = false;
  }

  /* One automatic attempt. If the app is not installed nothing happens and
     the page simply stays put, which is why the button exists too. */
  setTimeout(function () { location.href = url; }, 400);
})();
