// VTOP Plus event page. It never calls VTOP (SECURITY.md risk R2): every VTOP
// request goes through src/lib/vtop-request.js from a content script.
"use strict";

browser.runtime.onInstalled.addListener(({ reason }) => {
  console.log(`[ViBoot] installed (${reason})`);
});
