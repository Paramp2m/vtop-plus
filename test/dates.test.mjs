// VTOP date parsing and days left (src/lib/dates.js, PLAN.md M6).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const SRC = new URL("../src/", import.meta.url);
const ctx = { console };
ctx.globalThis = ctx;
for (const f of ["lib/ns.js", "lib/dates.js"]) runInNewContext(readFileSync(new URL(f, SRC), "utf8"), ctx);
const { parseDate, daysLeft } = ctx.ViBoot.dates;
const ymd = (d) => d && [d.getFullYear(), d.getMonth() + 1, d.getDate()];

test("dd-Mon-yyyy, as VTOP writes due dates", () => {
  assert.deepEqual(ymd(parseDate("17-Oct-2026")), [2026, 10, 17]);
  assert.deepEqual(ymd(parseDate(" 03-Nov-2026 ")), [2026, 11, 3]);
  assert.deepEqual(ymd(parseDate("1-jan-2027")), [2027, 1, 1]);
  assert.deepEqual(ymd(parseDate("09-Sept-2026")), [2026, 9, 9]);
  assert.equal(parseDate("17-Oct-2026").getHours(), 0, "local midnight");
});

test("dd-mm-yyyy and other separators", () => {
  assert.deepEqual(ymd(parseDate("17-10-2026")), [2026, 10, 17]);
  assert.deepEqual(ymd(parseDate("17/10/2026")), [2026, 10, 17]);
  assert.deepEqual(ymd(parseDate("17 Oct 2026")), [2026, 10, 17]);
});

test("months, years and leap days", () => {
  assert.deepEqual(ymd(parseDate("31-Dec-2026")), [2026, 12, 31]);
  assert.deepEqual(ymd(parseDate("29-Feb-2028")), [2028, 2, 29]);
  assert.equal(parseDate("29-Feb-2027"), null);
  assert.equal(parseDate("29-Feb-2100"), null);
  assert.deepEqual(ymd(parseDate("29-Feb-2000")), [2000, 2, 29]);
  assert.equal(parseDate("31-Apr-2026"), null);
  assert.equal(parseDate("00-Oct-2026"), null);
  assert.equal(parseDate("10-13-2026"), null);
});

test("anything else is null, never Invalid Date", () => {
  for (const bad of ["", "Nothing Left.", "17-Okt-2026", "2026-10-17", "17-Oct-26", null, undefined]) {
    assert.equal(parseDate(bad), null, String(bad));
  }
});

test("days left at today, 3 days and 4 days", () => {
  const due = parseDate("20-Oct-2026");
  // Noon on the due date: the due day itself, already past its midnight.
  assert.deepEqual({ ...daysLeft(due, new Date(2026, 9, 20, 12)) }, { left: -0, urgent: true });
  // Exactly 3 and 4 days before its midnight.
  assert.deepEqual({ ...daysLeft(due, new Date(2026, 9, 17)) }, { left: 3, urgent: true });
  assert.deepEqual({ ...daysLeft(due, new Date(2026, 9, 16)) }, { left: 4, urgent: false });
  // Part-way through a day rounds up, as the reference's Math.ceil did.
  assert.deepEqual({ ...daysLeft(due, new Date(2026, 9, 16, 9)) }, { left: 4, urgent: false }); // 3.6 days
  assert.deepEqual({ ...daysLeft(due, new Date(2026, 9, 17, 9)) }, { left: 3, urgent: true }); // 2.6 days
  assert.deepEqual({ ...daysLeft(due, new Date(2026, 9, 15, 23)) }, { left: 5, urgent: false });
});

test("days left across a month and a year", () => {
  assert.equal(daysLeft(parseDate("03-Nov-2026"), new Date(2026, 9, 15)).left, 19);
  assert.equal(daysLeft(parseDate("02-Jan-2027"), new Date(2026, 11, 30)).left, 3);
});
