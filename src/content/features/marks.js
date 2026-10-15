// Marks "Total" row and "marks needed to pass" row (PLAN.md M5), from ViBoot's
// modify_marks_page (ref/Viboot/js/marks_page.js:1-139). Each course's marks
// table gets a totals row and a pass-target row: for labs from the first
// assessment, for the rest once the internal assessments add up to 60%.
"use strict";

(function (ns) {
  const ID = "marks";

  // port: the reference split each row's innerHTML on "<td>" and read
  // [3], [4], [6], [7] (marks_page.js:27-33); VTOP's commented-out Class
  // Average cell made [8] comment text. These are the same columns as cell
  // indexes (Marks_view.html).
  const COL = { max: 2, weightagePercent: 3, scored: 5, weightageMark: 6 };
  // The course type in the course row above each marks table (marks_page.js:8-9).
  const COURSE_TYPE = 4;

  function cell(content, attrs = {}) {
    const td = document.createElement("td");
    Object.assign(td, attrs);
    if (content !== undefined) td.append(content);
    return td;
  }

  const bold = (text) => {
    const b = document.createElement("b");
    b.textContent = text;
    return b;
  };

  // port: the reference had a second, 11-column layout for when the Class
  // Average column was shown (marks_page.js:58-74); VTOP has commented that
  // column out, so only the 8-column row is kept, built with DOM APIs.
  function totalRow(sum) {
    const tr = document.createElement("tr");
    tr.className = "tableContent-level1 vtop-plus-marks-total";
    tr.dataset.viboot = ID;
    tr.append(
      cell(),
      cell(bold("Total:")),
      cell(sum.max.toFixed(2)),
      cell(sum.weightagePercent.toFixed(2)),
      cell(),
      cell(bold(sum.scored.toFixed(2))),
      cell(bold(sum.weightageMark.toFixed(2))),
      cell(bold(`Lost Weightage Marks: ${sum.lost.toFixed(2)}`)),
    );
    return tr;
  }

  // The reference's wording (marks_page.js:85, 93, 102, 113, 122, 133),
  // except for labs.
  function fatText(fat) {
    if (fat.passed) {
      if (fat.component === "theory") return `You need only ${fat.needed} marks out of 100 in FAT to pass theory component 🥳`;
      // Online courses kept the reference's lab wording (marks_page.js:100-102).
      if (fat.component === "lab" || fat.component === "online") return "You have fulfilled the criteria of passing the Lab Component 🥳";
      return "You have fulfilled the criteria of passing the STS 🥳";
    }
    // port: labs have no FAT any more (the student, 2026-10-15); the
    // reference said "… : <n> in FAT" (marks_page.js:113).
    if (fat.component === "lab") return `You need ${fat.needed.toFixed(2)} more marks to pass the Lab Component (50 overall)`;
    if (fat.component === "sts") return `Minimum marks required to clear STS is : ${fat.needed.toFixed(2)} marks`;
    return `Minimum marks required to clear this component is : ${fat.needed.toFixed(2)} in FAT`;
  }

  function fatRow(fat, colSpan) {
    const tr = document.createElement("tr");
    tr.className = `tableContent-level1 vtop-plus-marks-fat ${fat.passed ? "vtop-plus-marks-pass" : "vtop-plus-marks-need"}`;
    tr.dataset.viboot = ID;
    const text = fatText(fat);
    tr.append(cell(fat.passed ? text : bold(text), { colSpan }));
    return tr;
  }

  ns.register({
    id: ID,
    matches: (root, screen) => screen === "marks" && Boolean(root.querySelector(".customTable-level1")),
    apply(root) {
      let added = 0;
      for (const table of root.querySelectorAll("table.customTable-level1")) {
        const body = table.tBodies[0];
        if (!body || body.querySelector(`:scope > [data-viboot="${ID}"]`)) continue;

        // port: the reference paired the n-th marks table with every second
        // .tableContent row in the document (marks_page.js:4-10); the course
        // row is now found from the table itself.
        const courseRow = table.closest("tr")?.previousElementSibling;
        const courseType = courseRow?.cells[COURSE_TYPE]?.textContent.trim() ?? "";

        const rows = [];
        for (const row of body.querySelectorAll(":scope > tr.tableContent-level1")) {
          // The reference skipped rows with an inline background
          // (marks_page.js:21-25), which were its own added rows.
          if (row.style.background !== "" || row.cells.length <= COL.weightageMark) continue;
          rows.push({
            max: ns.markNumber(row.cells[COL.max].textContent),
            weightagePercent: ns.markNumber(row.cells[COL.weightagePercent].textContent),
            scored: ns.markNumber(row.cells[COL.scored].textContent),
            weightageMark: ns.markNumber(row.cells[COL.weightageMark].textContent),
          });
        }
        if (!rows.length) continue;

        const sum = ns.marksSummary(rows, courseType);
        body.append(totalRow(sum));
        // port: the reference used colspan 8 or 11 (marks_page.js:2, 23); this
        // spans however many columns the header row has.
        const colSpan = body.querySelector(":scope > tr.tableHeader-level1")?.cells.length || 8;
        if (sum.fat) body.append(fatRow(sum.fat, colSpan));
        added += 1;
      }
      if (added) ns.log(`marks: ${added} table(s)`);
    },
  });
})(globalThis.ViBoot);
