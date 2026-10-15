// Marks totals and the FAT target (src/lib/marks-math.js, PLAN.md M5). The
// rows themselves are checked in the browser against Marks_view.html.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const SRC = new URL("../src/", import.meta.url);
const ctx = { console };
ctx.globalThis = ctx;
for (const f of ["lib/ns.js", "lib/marks-math.js"]) runInNewContext(readFileSync(new URL(f, SRC), "utf8"), ctx);
const { fatTarget, marksSummary, markNumber } = ctx.ViBoot;
const fat = (...a) => {
  const r = fatTarget(...a);
  return r && { ...r };
};
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);

test("theory: 40 once the internals reach 34, else (34 − w)·2.5 + 40", () => {
  assert.deepEqual(fat("Theory Only", 60, 34), { component: "theory", passed: true, needed: 40 });
  assert.deepEqual(fat("Theory Only", 60, 45.5), { component: "theory", passed: true, needed: 40 });
  assert.deepEqual(fat("Theory Only", 60, 30), { component: "theory", passed: false, needed: 50 });
  close(fat("Embedded Theory", 60, 33.9).needed, 40.25);
});

test("theory needing more than 100 is reported as it is", () => {
  assert.deepEqual(fat("Theory Only", 60, 5), { component: "theory", passed: false, needed: 112.5 });
});

test("lab: 50 − w from the first assessment (no FAT)", () => {
  assert.deepEqual(fat("Lab Only", 60, 32), { component: "lab", passed: false, needed: 18 });
  assert.deepEqual(fat("Lab Only", 15, 12), { component: "lab", passed: false, needed: 38 });
  assert.deepEqual(fat("Embedded Lab", 70, 68), { component: "lab", passed: true, needed: 0 });
  assert.deepEqual(fat("Embedded Lab", 60, 50), { component: "lab", passed: true, needed: 0 });
});

test("online: 50 − w, only at 60", () => {
  assert.deepEqual(fat("Online Course", 60, 49), { component: "online", passed: false, needed: 1 });
  assert.equal(fat("Online Course", 40, 30), null);
});

test("soft skill: 50 − w", () => {
  assert.deepEqual(fat("Soft Skill", 60, 51.5), { component: "sts", passed: true, needed: 0 });
  assert.deepEqual(fat("Soft Skill", 60, 40), { component: "sts", passed: false, needed: 10 });
});

test("no target unless the weightage totals 60", () => {
  assert.equal(fat("Theory Only", 59.99, 40), null);
  assert.equal(fat("Theory Only", 60.01, 40), null);
  // 0.1 added 600 times isn't exactly 60, but it is 60.
  let w = 0;
  for (let i = 0; i < 600; i++) w += 0.1;
  assert.notEqual(w, 60);
  assert.equal(fat("Theory Only", w, 40).needed, 40);
});

test("unknown course types get no target", () => {
  assert.equal(fat("Project", 60, 10), null);
});

test("cell text to number, blanks as 0", () => {
  assert.equal(markNumber(" 14.0 "), 14);
  assert.equal(markNumber("7.5"), 7.5);
  assert.equal(markNumber(""), 0);
  assert.equal(markNumber("-"), 0);
});

const row = (max, weightagePercent, scored, weightageMark) => ({ max, weightagePercent, scored, weightageMark });

test("STS1001P (made-up soft-skill course): totals and STS passed", () => {
  const s = marksSummary([row(15, 15, 13, 13), row(15, 15, 12, 12), row(30, 15, 26, 13), row(30, 15, 24, 12)], "Soft Skill");
  assert.deepEqual([s.max, s.weightagePercent, s.scored, s.weightageMark], [90, 60, 75, 50]);
  close(s.lost, 10);
  assert.deepEqual({ ...s.fat }, { component: "sts", passed: true, needed: 0 });
});

test("THY1001L (made-up theory course): one CAT, no target yet", () => {
  const s = marksSummary([row(50, 15, 30, 9)], "Theory Only");
  close(s.lost, 6);
  assert.equal(s.fat, null);
});

test("lost marks use the rounded totals, as the reference did", () => {
  const s = marksSummary([row(10, 10, 3.333, 3.333), row(10, 10, 3.333, 3.333)], "Theory Only");
  close(s.lost, 20 - 6.67);
});
