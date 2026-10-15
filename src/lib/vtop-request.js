// Safety layer L4 (docs/SECURITY.md §4): the ONLY place VTOP Plus may call
// VTOP. Every path must be on the hardcoded read-only list below, and every
// field name must be on that path's list. Anything else throws before a
// request is made. test/endpoints.test.mjs checks this list against the
// guard's rules.json and checks that no other file sends requests.
//
// Content scripts only. Never call this from the background page: the network
// guard can't see background-page requests (SECURITY.md risk R2).
"use strict";

(function (ns) {
  const BASE = "/vtop/";

  // path -> allowed POST field names (a subset of SECURITY.md §5.2).
  const ENDPOINTS = Object.freeze({
    "examinations/processDigitalAssignment": ["_csrf", "authorizedID", "classId", "x"],
    "examinations/doDownloadQuestion/": ["_csrf", "authorizedID", "classIdNumber", "code"],
    "examinations/downloadSTudentDA/": ["_csrf", "authorizedID", "classId1", "code1"],
    "downloadCourseMaterialFacultyPdf": ["_csrf", "authorizedID", "fileId"],
  });

  const ORIGINS = ["https://vtop.vit.ac.in", "http://127.0.0.1:8737"];

  function check(path, fields = {}) {
    if (typeof path !== "string" || !Object.hasOwn(ENDPOINTS, path)) {
      throw new Error(`[ViBoot] vtop-request: path not allowed: ${String(path)}`);
    }
    for (const name of Object.keys(fields)) {
      if (!ENDPOINTS[path].includes(name)) {
        throw new Error(`[ViBoot] vtop-request: field not allowed on ${path}: ${name}`);
      }
    }
  }

  // Firefox's `content.fetch` sends the request as the page itself (the page's
  // Origin, Referer and cookies), exactly like VTOP's own AJAX, and the
  // network guard sees it. The plain `fetch` is the fallback outside a
  // Firefox content script (Node tests). Analysis §3.5, M1 probe 3.
  function pageFetch() {
    const page = globalThis.content;
    return typeof page?.fetch === "function" ? page.fetch.bind(page) : fetch;
  }

  // POST `fields` (form-encoded) to an allowed path on the current origin.
  // `xhr: true` adds the X-Requested-With header that VTOP's own AJAX calls
  // send (the reference sent it too: ref/Viboot/js/da_upload.js:122).
  async function request(path, fields = {}, { origin = globalThis.location?.origin, xhr = false } = {}) {
    check(path, fields);
    if (!ORIGINS.includes(origin)) {
      throw new Error(`[ViBoot] vtop-request: origin not allowed: ${origin}`);
    }
    const headers = { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" };
    if (xhr) headers["X-Requested-With"] = "XMLHttpRequest";
    return pageFetch()(`${origin}${BASE}${path}`, {
      method: "POST",
      credentials: "same-origin",
      headers,
      body: new URLSearchParams(fields).toString(),
    });
  }

  ns.request = Object.freeze({ ENDPOINTS, check, request });
})(globalThis.ViBoot);
