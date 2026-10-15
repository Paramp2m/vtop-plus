// "75% Attendance Alert" column (PLAN.md M4), from ViBoot's
// view_attendance_page (ref/Viboot/js/attendance.js:2-131). Adds a caution
// banner above the attendance table, a column saying how many classes to
// attend or how many can be skipped, and a colour legend below.
"use strict";

(function (ns) {
  const ID = "attendance";

  // port: the reference read row.childNodes[11], [13] and [5], which count
  // the whitespace text nodes between cells (attendance.js:50-52). These are
  // the same columns as element indexes (Attendance_page.html).
  const COL = { course: 2, attended: 5, total: 6, percentage: 7 };

  const marked = (el) => el.querySelector(`:scope > [data-viboot="${ID}"]`);

  function paragraph(text, className) {
    const p = document.createElement("p");
    p.className = className;
    p.textContent = text;
    return p;
  }

  // port: the reference built the banner and legend from innerHTML strings
  // with inline styles (attendance.js:21-33); same text, styles in viboot.css.
  function banner() {
    const div = document.createElement("div");
    div.dataset.viboot = ID;
    const p = document.createElement("p");
    p.className = "vtop-plus-att-caution";
    const b = document.createElement("b");
    b.textContent =
      "*Note: This calculator doesn't calculate the attendance till the exam date, It only calculates the attendance to 74.01%";
    p.append(b);
    div.append(p);
    return div;
  }

  function legend() {
    const div = document.createElement("div");
    div.dataset.viboot = ID;
    div.className = "vtop-plus-att-legend";
    div.append(
      paragraph("*Attendance Greater than 75%", "vtop-plus-att-green"),
      paragraph("*Be Cautious your Attendance is in between 74.01% to 74.99%", "vtop-plus-att-orange"),
      paragraph("*Attendance Less than 75%", "vtop-plus-att-red"),
    );
    return div;
  }

  // The reference's wording (attendance.js:77, 84, 114, 124).
  function alertCell(result) {
    const td = document.createElement("td");
    td.dataset.viboot = ID;
    td.className = `vtop-plus-att-cell vtop-plus-att-${result.colour}`;
    const p = document.createElement("p");
    const unit = result.lab ? "lab(s)" : "class(es)";
    if (result.kind === "attend") {
      p.textContent = `${result.count} ${unit} should be attended`;
    } else if (result.kind === "skip") {
      p.append(`Only ${result.count} ${unit} can be Skipped`, document.createElement("br"), "be Cautious");
    } else {
      // port: new text for total = 0 (the reference showed "Only 0 … can be Skipped").
      p.textContent = "No classes yet";
    }
    td.append(p);
    return td;
  }

  const number = (cell) => parseFloat(cell.textContent);

  ns.register({
    id: ID,
    matches: (root, screen) => screen === "attendance" && Boolean(root.getElementById("AttendanceDetailDataTable")),
    apply(root) {
      const table = root.getElementById("AttendanceDetailDataTable");
      // Banner above and legend inside the table's grandparent
      // (attendance.js:18-33). Each piece is added only if it's missing, so
      // apply can run any number of times.
      const anchor = table.parentElement.parentElement;
      if (!anchor.previousElementSibling?.matches(`[data-viboot="${ID}"]`)) {
        anchor.insertAdjacentElement("beforebegin", banner());
      }
      if (!marked(anchor)) anchor.insertAdjacentElement("beforeend", legend());

      // port: the reference took the first <thead> and <tbody> in the
      // document (attendance.js:36-44); the attendance detail modal has a
      // table too, so this one is named.
      const headRow = table.tHead?.rows[0];
      if (headRow && !marked(headRow)) {
        const th = headRow.cells[0].cloneNode(true);
        th.textContent = "75% Attendance Alert";
        th.dataset.viboot = ID;
        headRow.cells[COL.percentage].insertAdjacentElement("afterend", th);
      }

      let added = 0;
      for (const body of table.tBodies) {
        for (const row of body.rows) {
          // Skips "no data" rows and DataTables' responsive child rows
          // (the reference's childNodes.length > 3, attendance.js:47).
          if (row.cells.length <= COL.percentage || marked(row)) continue;
          const result = ns.attendanceAlert(
            number(row.cells[COL.attended]),
            number(row.cells[COL.total]),
            row.cells[COL.course].textContent.trim(),
          );
          // port: inserted after the percentage cell with DOM APIs; the
          // reference spliced HTML lines (attendance.js:46, 58-60, 74-79),
          // which put the <td> inside the percentage cell and re-parsed the
          // whole row.
          row.cells[COL.percentage].insertAdjacentElement("afterend", alertCell(result));
          added += 1;
        }
      }
      if (added) ns.log(`attendance: ${added} row(s)`);
    },
  });
})(globalThis.ViBoot);
