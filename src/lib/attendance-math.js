// The "75% Attendance Alert" maths (PLAN.md M4), from ViBoot's
// view_attendance_page (ref/Viboot/js/attendance.js:62-128). A classic
// script: it runs in the content script and loads in Node for the tests.
"use strict";

(function (ns) {
  // VIT rounds 74.01% up to 75%, so this is the real target
  // (attendance.js:66-69, 92-95).
  const TARGET = 0.7401;

  // port: the reference matched "Lab" anywhere in the course detail
  // (attendance.js:71, 105), so a theory course with "Lab" in its title would
  // be halved. Only the type after the last " - " is checked now
  // (for example "XXX000E - Course Title - Embedded Lab").
  function isLab(courseDetail) {
    const parts = String(courseDetail).split(" - ");
    return parts[parts.length - 1].includes("Lab");
  }

  // Returns { kind, count, lab, colour }:
  //   kind "attend": `count` more classes (or labs) are needed to reach 74.01%
  //   kind "skip":   `count` classes (or labs) can be missed and stay at 74.01%
  //   kind "none":   no classes held yet
  // colour is "red" below 74.01%, "orange" from 74.01% to 74.99%, else "green".
  ns.attendanceAlert = function attendanceAlert(attended, total, courseDetail) {
    const lab = isLab(courseDetail);
    // port: total = 0 made the ratio NaN, which fell through to a green
    // "Only 0 can be Skipped" (analysis §3.1).
    if (!(total > 0) || !(attended >= 0)) return { kind: "none", count: 0, lab, colour: "none" };

    const ratio = attended / total;
    if (ratio < TARGET) {
      let count = Math.ceil((TARGET * total - attended) / 0.2599);
      // One lab is two periods (attendance.js:71-73).
      if (lab) count = Math.ceil(count / 2);
      return { kind: "attend", count, lab, colour: "red" };
    }

    let count = Math.floor((attended - TARGET * total) / TARGET);
    if (lab) count = Math.floor(count / 2);
    // Floating-point error right at the target can give -1 (attendance.js:108-110, 118-120).
    if (count === -1) count = 0;
    const colour = ratio <= 0.7499 ? "orange" : "green";
    return { kind: "skip", count, lab, colour };
  };
})(globalThis.ViBoot);
