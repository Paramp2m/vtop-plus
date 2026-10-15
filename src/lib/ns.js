// VTOP Plus shared namespace. A classic script: it runs first in the content
// script and also loads in Node (through `vm`) for the unit tests.
"use strict";

globalThis.ViBoot = globalThis.ViBoot || {
  // Features register here: { id, matches(root, screen), apply(root, screen) }.
  // `apply` must be idempotent (see docs/PLAN.md, ground rules).
  features: [],

  // Adds a feature. Content-script entries can be injected in either order,
  // so if the router is already running it is asked to run again.
  register(feature) {
    this.features.push(feature);
    this.refresh?.();
  },

  log(message, ...rest) {
    console.log(`[ViBoot] ${message}`, ...rest);
  },
};
