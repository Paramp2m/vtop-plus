// Date parsing for VTOP's date strings (PLAN.md M6). A classic script: it runs
// in the content script and loads in Node for the tests.
//
// port: the reference handed VTOP's "17-Oct-2026" to `new Date(...)`
// (ref/Viboot/js/da_upload.js:169, 184), which is non-standard and can be
// Invalid Date; dates are parsed field by field here instead.
"use strict";

(function (ns) {
  const DAY_MS = 24 * 3600 * 1000;

  // The reference's month map (da_upload.js:4-18), keyed in lowercase.
  const MONTHS = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8,
    sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  };

  // "17-Oct-2026" or "17-10-2026" (also with "/" or spaces) -> a local-time
  // Date at midnight, or null if it isn't a real calendar date.
  function parseDate(text) {
    const m = /^\s*(\d{1,2})[-/ ]([A-Za-z]{3,4}|\d{1,2})[-/ ](\d{4})\s*$/.exec(String(text ?? ""));
    if (!m) return null;
    const day = Number(m[1]);
    const month = /\d/.test(m[2]) ? Number(m[2]) : MONTHS[m[2].toLowerCase()];
    const year = Number(m[3]);
    if (!month || month > 12 || day < 1) return null;
    const date = new Date(year, month - 1, day);
    // Rejects 31-Apr, 29-Feb in a common year, and so on.
    if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date;
  }

  // Days from `now` to the start of the due date, as the reference counted them
  // (da_upload.js:184-189): `left` is rounded up, and the cell turns red when
  // the unrounded difference is 3 days or less.
  function daysLeft(due, now = new Date()) {
    const diff = (due.getTime() - now.getTime()) / DAY_MS;
    return { left: Math.ceil(diff), urgent: diff <= 3 };
  }

  ns.dates = Object.freeze({ parseDate, daysLeft });
})(globalThis.ViBoot);
