// Marks totals and the FAT target (PLAN.md M5), from ViBoot's
// modify_marks_page (ref/Viboot/js/marks_page.js:11-137). A classic script:
// it runs in the content script and loads in Node for the tests.
"use strict";

(function (ns) {
  // The FAT row only appears once the internal assessments add up to 60%
  // (marks_page.js:80, 100, 120).
  const INTERNAL = 60;
  // port: the reference compared the summed float with `== 60`
  // (marks_page.js:80); sums like 0.1 + 0.2 + … can miss by a rounding error.
  const isInternalDone = (w) => Math.abs(w - INTERNAL) < 1e-6;

  // The reference stripped everything but digits and dots, then parseFloat
  // (marks_page.js:30-38).
  // port: a blank cell gave NaN, which turned the whole total into "NaN";
  // it counts as 0 now.
  ns.markNumber = function markNumber(text) {
    const n = parseFloat(String(text).replace(/[^0-9.]+/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  // Returns which pass rule applies: "theory", "lab", "online" or "sts"
  // (Soft Skill), in the reference's order (marks_page.js:80, 100, 120), or
  // null for none.
  // port: the reference treated Lab and Online alike (marks_page.js:100); labs
  // no longer have a FAT (the student, 2026-10-15), so they are split.
  function component(courseType) {
    const t = String(courseType);
    if (t.includes("Theory")) return "theory";
    if (t.includes("Lab")) return "lab";
    if (t.includes("Online")) return "online";
    if (t.includes("Soft")) return "sts";
    return null;
  }

  // The pass target for a course, or null when there isn't one yet.
  //   { component, passed: true,  needed }  the marks so far already clear it
  //   { component, passed: false, needed }  `needed` more marks are required
  // For theory, `needed` is FAT marks out of 100; for the rest it is in
  // weightage marks. Theory can come out above 100 (it is shown as it is, as
  // ViBoot did).
  ns.fatTarget = function fatTarget(courseType, weightagePercent, weightageMark) {
    const kind = component(courseType);
    if (!kind) return null;
    const w = weightageMark;
    // port: labs have no FAT any more, so the reference's wait for 60%
    // (marks_page.js:100) is gone: a lab shows the marks still needed for
    // 50 overall from its first assessment (the student, 2026-10-15).
    if (kind === "lab") {
      if (w >= 50) return { component: kind, passed: true, needed: 0 };
      return { component: kind, passed: false, needed: 50 - w };
    }
    if (!isInternalDone(weightagePercent)) return null;
    if (kind === "theory") {
      // FAT ≥ 40, and 0.4·FAT + w ≥ 50 (marks_page.js:81-90).
      if (w >= 34) return { component: kind, passed: true, needed: 40 };
      return { component: kind, passed: false, needed: (34 - w) * 2.5 + 40 };
    }
    // Online and Soft Skill: 50 in all (marks_page.js:101-110, 121-130).
    if (w >= 50) return { component: kind, passed: true, needed: 0 };
    return { component: kind, passed: false, needed: 50 - w };
  };

  // rows: [{ max, weightagePercent, scored, weightageMark }] for one course.
  // Totals as the reference shows them, plus the lost weightage marks, which
  // it worked out from the rounded totals (marks_page.js:55).
  ns.marksSummary = function marksSummary(rows, courseType) {
    // port: totals start at 0 for every table; the reference's `other` and
    // `colspan` flags leaked from one table to the next (analysis §3.2).
    const total = { max: 0, weightagePercent: 0, scored: 0, weightageMark: 0 };
    for (const row of rows) {
      for (const key of Object.keys(total)) total[key] += row[key];
    }
    const lost = Number(total.weightagePercent.toFixed(2)) - Number(total.weightageMark.toFixed(2));
    return { ...total, lost, fat: ns.fatTarget(courseType, total.weightagePercent, total.weightageMark) };
  };
})(globalThis.ViBoot);
