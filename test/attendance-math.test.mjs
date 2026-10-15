// The 75% attendance maths (src/lib/attendance-math.js, PLAN.md M4). The
// column itself is checked in the browser against Attendance_page.html.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const SRC = new URL("../src/", import.meta.url);
const ctx = { console };
ctx.globalThis = ctx;
for (const f of ["lib/ns.js", "lib/attendance-math.js"]) runInNewContext(readFileSync(new URL(f, SRC), "utf8"), ctx);
const alert = (a, t, course = "X - Course - Theory Only") => ({ ...ctx.ViBoot.attendanceAlert(a, t, course) });

const THEORY = "AAA101L - Course A - Theory Only";
const LAB = "AAA101P - Course A Lab - Lab Only";

test("exactly 74.01% is orange with nothing to skip", () => {
  assert.deepEqual(alert(7401, 10000), { kind: "skip", count: 0, lab: false, colour: "orange" });
});

test("74.5% is orange", () => {
  // floor((149 - 0.7401*200) / 0.7401) = floor(1.32) = 1
  assert.deepEqual(alert(149, 200), { kind: "skip", count: 1, lab: false, colour: "orange" });
});

test("above the target: classes that can be skipped", () => {
  // floor((40 - 37.005) / 0.7401) = floor(4.05) = 4
  assert.deepEqual(alert(40, 50), { kind: "skip", count: 4, lab: false, colour: "green" });
  assert.ok(40 / 54 >= 0.7401 && 40 / 55 < 0.7401, "4 skips keep 74.01%, 5 don't");
});

test("below the target: classes to attend", () => {
  // ceil((0.7401*30 - 20) / 0.2599) = ceil(8.48) = 9
  assert.deepEqual(alert(20, 30, THEORY), { kind: "attend", count: 9, lab: false, colour: "red" });
  assert.ok(29 / 39 >= 0.7401 && 28 / 38 < 0.7401, "9 more reach 74.01%, 8 don't");
});

test("total = 0 is 'none', not NaN", () => {
  assert.deepEqual(alert(0, 0), { kind: "none", count: 0, lab: false, colour: "none" });
  assert.equal(alert(NaN, 10).kind, "none");
});

test("labs are halved (one lab is two periods)", () => {
  // attend: ceil((0.7401*20 - 8) / 0.2599) = 27, ceil(27 / 2) = 14
  assert.deepEqual(alert(8, 20, LAB), { kind: "attend", count: 14, lab: true, colour: "red" });
  // skip: floor(4 / 2) = 2
  assert.deepEqual(alert(40, 50, "X - Y - Embedded Lab"), { kind: "skip", count: 2, lab: true, colour: "green" });
  // floor(1 / 2) = 0, and the -1 clamp at the target
  assert.equal(alert(149, 200, LAB).count, 0);
  assert.equal(alert(7401, 10000, LAB).count, 0);
});

test("only the course type decides lab or theory", () => {
  assert.equal(alert(1, 2, "CCC303E - Course C - Embedded Lab").lab, true);
  assert.equal(alert(1, 2, "CCC303E - Course C - Embedded Theory").lab, false);
  assert.equal(alert(1, 2, "DDD404L - Labour Economics - Theory Only").lab, false);
  assert.equal(alert(1, 2, "STS1001P - Soft Skills - I - Soft Skill").lab, false);
});

test("a course needing more classes than remain still gets the plain count", () => {
  // The calculator doesn't know how many classes are left (the caution banner says so).
  // ceil((0.7401*40 - 5) / 0.2599) = ceil(94.66) = 95
  assert.deepEqual(alert(5, 40), { kind: "attend", count: 95, lab: false, colour: "red" });
});

// Hand calculations for three made-up rows (PLAN.md M4), as the column shows them.
//   AAA101L Theory Only  20/30: ceil((22.203 - 20) / 0.2599) = ceil(8.48) = 9 class(es)
//   AAA101P Lab Only      8/20: ceil((14.802 - 8) / 0.2599) = ceil(26.17) = 27 → 14 lab(s)
//   CCC303E Embedded Lab 25/40: ceil((29.604 - 25) / 0.2599) = ceil(17.71) = 18 → 9 lab(s)
export const FIXTURE_ROWS = [
  [20, 30, THEORY, "9 class(es) should be attended"],
  [8, 20, LAB, "14 lab(s) should be attended"],
  [25, 40, "CCC303E - Course C - Embedded Lab", "9 lab(s) should be attended"],
];

test("made-up rows match the hand calculations", () => {
  for (const [a, t, course, text] of FIXTURE_ROWS) {
    const r = alert(a, t, course);
    assert.equal(`${r.count} ${r.lab ? "lab(s)" : "class(es)"} should be attended`, text);
  }
});
