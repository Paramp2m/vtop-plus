// "Upcoming Dues" and the DA table sort (PLAN.md M6), from ViBoot's da_page
// and sort_table (ref/Viboot/js/da_upload.js:141-199, 318-411). Pure logic; the
// DOM side is content/features/da-list.js and da-sort.js.
"use strict";

(function (ns) {
  const NOTHING_LEFT = "Nothing Left.";

  // `rows`: one { date, green, uploaded } per assignment on a course's DA page,
  // where `date` is the due-date text and `green` means VTOP coloured it green
  // (still open). Returns the soonest open, not-uploaded one as
  // { text, left, urgent }, or { text: "Nothing Left.", left: NaN, urgent: false }.
  ns.nextDue = function nextDue(rows, now = new Date()) {
    let best = null;
    for (const row of rows) {
      // da_upload.js:151: green and not uploaded.
      if (!row.green || row.uploaded) continue;
      const due = ns.dates.parseDate(row.date);
      // port: an unparseable date is skipped rather than sorted as Invalid Date.
      if (!due) continue;
      if (!best || due < best.due) best = { due, text: row.date.trim() };
    }
    if (!best) return { text: NOTHING_LEFT, left: NaN, urgent: false };
    return { text: best.text, ...ns.dates.daysLeft(best.due, now) };
  };

  // The column compare of sort_table (da_upload.js:336-394), with the
  // "Upcoming Dues" column at index 4. `a` and `b` are { texts, left }:
  // the row's cell texts and its days left (NaN when nothing is due).
  function compare(n, a, b) {
    if (n === 0) return Number.parseInt(a.texts[0], 10) - Number.parseInt(b.texts[0], 10);
    if (n === 4) {
      // A row with nothing due counts as -1 days (da_upload.js:342-347).
      const x = Number.isNaN(a.left) ? -1 : a.left;
      const y = Number.isNaN(b.left) ? -1 : b.left;
      return x - y;
    }
    // port: the reference compared innerHTML (da_upload.js:353); the text is
    // compared now, so markup can't change the order.
    const x = a.texts[n].toLowerCase();
    const y = b.texts[n].toLowerCase();
    return x < y ? -1 : x > y ? 1 : 0;
  }

  // The columns the reference sorts (da_upload.js:354, 360, 367); clicking
  // anything else does nothing.
  const SORTABLE = [0, 1, 2, 3, 4, 5, 6];

  // Returns the new order of `rows` for a click on column n: ascending, or
  // descending if the rows are already ascending (da_upload.js:325-409, where
  // a bubble sort with no swaps flips the direction). Ties keep their order.
  //
  // port: the bubble sort moved DOM rows one swap at a time; the order is
  // worked out here and the rows are moved once.
  ns.daSortOrder = function daSortOrder(rows, n) {
    if (!SORTABLE.includes(n)) return rows.slice();
    const asc = rows.slice().sort((a, b) => compare(n, a, b) || 0);
    const already = asc.every((row, i) => row === rows[i]);
    if (!already) return asc;
    return rows.slice().sort((a, b) => compare(n, b, a) || 0);
  };

  ns.daDues = Object.freeze({ NOTHING_LEFT, SORTABLE });
})(globalThis.ViBoot);
