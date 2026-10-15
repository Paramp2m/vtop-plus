// "Upcoming Dues" and the DA list sort (src/lib/da-dues.js, PLAN.md M6). The
// column itself is checked in the browser against Assignment_upload.html.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const SRC = new URL("../src/", import.meta.url);
const ctx = { console };
ctx.globalThis = ctx;
for (const f of ["lib/ns.js", "lib/dates.js", "lib/da-dues.js"]) runInNewContext(readFileSync(new URL(f, SRC), "utf8"), ctx);
const { nextDue, daSortOrder } = ctx.ViBoot;
const due = (rows, now) => ({ ...nextDue(rows, now) });

const NOW = new Date(2026, 9, 15, 10); // 15 Oct 2026, 10:00
const open = (date, uploaded = false) => ({ date, green: true, uploaded });
const closed = (date) => ({ date, green: false, uploaded: false });

// The assignment rows of Prob_assignment_upload.html.
const FIXTURE = [
  closed("22-Aug-2026"), closed("22-Aug-2026"), closed("19-Sep-2026"), closed("19-Sep-2026"),
  open("17-Oct-2026", true), open("17-Oct-2026", true),
  open("25-Oct-2026"), open("03-Nov-2026"), open("03-Nov-2026"), open("03-Nov-2026"),
];

test("the fixture's next due is 25-Oct, 10 days away", () => {
  // (25 Oct 00:00 − 15 Oct 10:00) = 9.58 days → 10
  assert.deepEqual(due(FIXTURE, NOW), { text: "25-Oct-2026", left: 10, urgent: false });
});

test("the soonest open, not-uploaded date wins, whatever the row order", () => {
  const rows = [open("03-Nov-2026"), open("18-Oct-2026"), open("01-Dec-2026")];
  assert.deepEqual(due(rows, NOW), { text: "18-Oct-2026", left: 3, urgent: true });
  assert.deepEqual(due(rows.reverse(), NOW).text, "18-Oct-2026");
});

test("ordering is by date, not by text", () => {
  // As strings "02-Nov" < "30-Oct"; as dates 30-Oct is first.
  assert.equal(due([open("02-Nov-2026"), open("30-Oct-2026")], NOW).text, "30-Oct-2026");
  assert.equal(due([open("05-Jan-2027"), open("20-Dec-2026")], NOW).text, "20-Dec-2026");
});

test("all assignments submitted", () => {
  const rows = [open("25-Oct-2026", true), open("03-Nov-2026", true)];
  const d = due(rows, NOW);
  assert.equal(d.text, "Nothing Left.");
  assert.ok(Number.isNaN(d.left));
  assert.equal(d.urgent, false);
});

test("no upcoming assignments", () => {
  assert.equal(due([closed("22-Aug-2026"), closed("19-Sep-2026")], NOW).text, "Nothing Left.");
  assert.equal(due([], NOW).text, "Nothing Left.");
});

test("an unparseable date is skipped", () => {
  assert.equal(due([open("soon"), open("03-Nov-2026")], NOW).text, "03-Nov-2026");
  assert.equal(due([open("")], NOW).text, "Nothing Left.");
});

test("due within 3 days is urgent; 4 days is not", () => {
  assert.equal(due([open("18-Oct-2026")], new Date(2026, 9, 15)).urgent, true);
  assert.equal(due([open("19-Oct-2026")], new Date(2026, 9, 15)).urgent, false);
});

// Rows as da-sort.js builds them: the 8 cell texts and the days left.
const row = (sl, code, title, left, type = "TH") => ({
  texts: [String(sl), `VL${sl}`, code, title, "", type, "FAC", ""],
  left,
});
const A = row(1, "AAA101P", "Probability", 10);
const B = row(2, "BBB202L", "kinematics", NaN);
const C = row(10, "CCC303P", "Materials", 2);
const codes = (rows) => rows.map((r) => r.texts[2]);

test("first click sorts ascending, a second click descending", () => {
  const start = [C, B, A];
  const asc = daSortOrder(start, 2);
  assert.deepEqual(codes(asc), ["AAA101P", "BBB202L", "CCC303P"]);
  assert.deepEqual(codes(daSortOrder(asc, 2)), ["CCC303P", "BBB202L", "AAA101P"]);
  // ...and back to ascending.
  assert.deepEqual(codes(daSortOrder(daSortOrder(asc, 2), 2)), codes(asc));
});

test("Sl.No sorts as a number, text columns ignore case", () => {
  assert.deepEqual(codes(daSortOrder([C, A, B], 0)), ["AAA101P", "BBB202L", "CCC303P"]); // 1, 2, 10
  assert.deepEqual(codes(daSortOrder([A, B, C], 3)), ["BBB202L", "CCC303P", "AAA101P"]); // kin, mat, pro
});

test("Upcoming Dues sorts by days left, nothing due counting as -1", () => {
  assert.deepEqual(codes(daSortOrder([A, C, B], 4)), ["BBB202L", "CCC303P", "AAA101P"]); // -1, 2, 10
  assert.deepEqual(codes(daSortOrder([B, C, A], 4)), ["AAA101P", "CCC303P", "BBB202L"]); // already asc → desc
});

test("ties keep their order; Dashboard doesn't sort", () => {
  const X = row(3, "X", "same", 1, "LO");
  const Y = row(4, "Y", "same", 1, "LO");
  // LO, LO, TH is already ascending, so descending: TH first, the two LOs keep their order.
  assert.deepEqual(codes(daSortOrder([Y, X, A], 5)), ["AAA101P", "Y", "X"]);
  assert.deepEqual(codes(daSortOrder([A, Y, X], 5)), ["Y", "X", "AAA101P"]);
  assert.deepEqual(codes(daSortOrder([Y, X, A], 7)), ["Y", "X", "AAA101P"]);
});
