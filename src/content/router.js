// The page router. VTOP changes screens without a page load, so one
// MutationObserver watches the page and, once it has been quiet for a moment,
// works out the screen and runs every registered feature. Features are
// idempotent, so running them again on unrelated mutations is harmless.
"use strict";

(function (ns) {
  const QUIET_MS = 100; // run once mutations stop for this long...
  const MAX_WAIT_MS = 500; // ...but never wait longer than this

  let lastScreen = null;
  let changes = 0; // screen changes seen in this document
  let timer = 0;
  let firstMutation = 0;

  function run() {
    timer = 0;
    firstMutation = 0;
    const screen = ns.screen(document);
    if (screen && screen !== lastScreen) {
      lastScreen = screen;
      changes += 1;
      ns.log(`screen=${screen}`);
      // Also recorded on <html>, so tests can read it without the console.
      document.documentElement.dataset.vtopPlusScreen = `${screen} ${changes}`;
    }
    for (const feature of ns.features) {
      try {
        if (feature.matches(document, screen)) feature.apply(document, screen);
      } catch (error) {
        ns.log(`feature ${feature.id} failed`, error);
      }
    }
  }

  function schedule() {
    const now = Date.now();
    if (!firstMutation) firstMutation = now;
    clearTimeout(timer);
    const wait = Math.min(QUIET_MS, Math.max(0, firstMutation + MAX_WAIT_MS - now));
    timer = setTimeout(run, wait);
  }

  ns.startRouter = function startRouter() {
    // Probe 1 (PLAN.md M1): has window.load already fired at document_idle?
    ns.log(`readyState=${document.readyState}`);
    ns.refresh = schedule; // for features registered after this (ns.register)
    run();
    // The whole body, not just #b5-pagewrapper: the login pages have no
    // wrapper, and the debounce keeps the cost down.
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  };
})(globalThis.ViBoot);
