// Click a column header to sort the DA list (PLAN.md M6), from ViBoot's sort
// and sort_table (ref/Viboot/js/da_upload.js:208-218, 318-422). The first
// click sorts ascending, a click on an already ascending column sorts
// descending; "Upcoming Dues" sorts by days left.
"use strict";

(function (ns) {
  const ID = "da-sort";
  const DUES = "da-dues";

  function sortBy(table, n) {
    const header = table.querySelector("tr.tableHeader");
    // port: the reference sorted document.getElementsByTagName("tbody")[0]
    // (da_upload.js:319), the first tbody on the page; this is the DA table's.
    const body = header.parentElement;
    const rows = [...body.querySelectorAll(":scope > tr.tableContent")];
    const items = rows.map((row) => ({
      row,
      texts: [...row.cells].map((td) => td.textContent.trim()),
      // Days left from da-list.js (NaN while loading or when nothing is due).
      left: Number(row.querySelector(`[data-viboot="${DUES}"]`)?.dataset.vtopPlusLeft ?? NaN),
    }));
    for (const item of ns.daSortOrder(items, n)) body.append(item.row);
  }

  ns.register({
    id: ID,
    matches: (root, screen) =>
      screen === "da-list" &&
      // Waits for the dues column, so the header indexes match the
      // reference's (da_upload.js:208 sorts after the column is added).
      Boolean(root.querySelector(`form#digitalAssignment tr.tableHeader [data-viboot="${DUES}"]`)),
    apply(root) {
      const table = root.querySelector("form#digitalAssignment table.customTable");
      const header = table.querySelector("tr.tableHeader");
      if (header.dataset.viboot === ID) return;
      header.dataset.viboot = ID;

      // The last header (Dashboard) isn't sortable (da_upload.js:417).
      [...header.cells].slice(0, -1).forEach((td, n) => {
        // port: a pointer cursor shows the headers can be clicked.
        td.classList.add("vtop-plus-da-sortable");
        td.addEventListener("click", () => {
          try {
            sortBy(table, n);
          } catch (error) {
            ns.log("da-sort failed", error);
          }
        });
      });

      // The hint above the table (da_upload.js:210-218).
      const hint = document.createElement("div");
      hint.dataset.viboot = ID;
      const p = document.createElement("p");
      p.className = "vtop-plus-da-hint";
      p.textContent = "*Click on the Header (Sl. No,Course code..) of the table to sort";
      hint.append(p);
      table.insertAdjacentElement("beforebegin", hint);
    },
  });
})(globalThis.ViBoot);
