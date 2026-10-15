// "Upcoming Dues" column on the DA list (PLAN.md M6), from ViBoot's da_page
// (ref/Viboot/js/da_upload.js:72-219). For each course it fetches the
// course's DA page, as VTOP's own folder button does, and shows the soonest
// open, not-uploaded due date and the days left (red at 3 days or fewer).
"use strict";

(function (ns) {
  const ID = "da-dues";
  const MAX_PARALLEL = 3;

  // Columns of the course list (Assignment_upload.html), before the new cell.
  const COL = { classId: 1, title: 3 };
  // The new column goes in front of Course Type: the reference spliced the
  // header at line 5 and rows at line 6 of their innerHTML
  // (da_upload.js:99-110), which lands at cell index 4 in both.
  const INSERT_AT = 4;
  // Columns of an assignment row on the course's DA page
  // (Prob_assignment_upload.html).
  const DA = { due: 4, lastUpdated: 6 };

  // port: the reference set these inline (da_upload.js:185-188).
  const URGENT_BG = "rgb(238, 75, 43, 0.6)";
  const OK_BG = "rgb(170, 255, 0, 0.6)";

  function newCell() {
    const td = document.createElement("td");
    td.style.width = "12%";
    td.dataset.viboot = ID;
    return td;
  }

  // One { date, green, uploaded } per assignment row (da_upload.js:131-166).
  function readAssignments(doc) {
    const rows = [];
    // port: the reference walked every ".fixedContent.tableContent" row,
    // including the course row of the first table, and relied on try/catch to
    // skip it (da_upload.js:131-165); only rows with all the assignment
    // columns are read now, by cell index instead of childNodes[9]/[1].
    for (const row of doc.querySelectorAll("form#daUpload tr.fixedContent.tableContent")) {
      if (row.cells.length <= DA.lastUpdated) continue;
      const span = row.cells[DA.due].querySelector("span");
      if (!span) continue;
      // Uploaded means the "Last Updated On" span has text (da_upload.js:146-149).
      const updated = row.cells[DA.lastUpdated].firstElementChild;
      rows.push({
        date: span.textContent,
        green: span.style.color === "green",
        uploaded: updated ? updated.innerHTML !== "" : false,
      });
    }
    return rows;
  }

  function show(td, due) {
    const span = document.createElement("span");
    span.append(due.text);
    // da_upload.js:191-199: days left only when there is a date.
    if (!Number.isNaN(due.left)) span.append(document.createElement("br"), `(${due.left} days left)`);
    td.replaceChildren(span);
    td.style.background = due.urgent ? URGENT_BG : OK_BG;
    // For da-sort.js.
    td.dataset.vtopPlusLeft = String(due.left);
  }

  // port: the reference left the cell empty and logged the error
  // (da_upload.js:204); it says so in the cell now.
  function showError(td) {
    const span = document.createElement("span");
    span.className = "vtop-plus-da-error";
    span.textContent = "Couldn't load";
    td.replaceChildren(span);
  }

  async function fetchDue(form, classId, td) {
    // port: the reference took `_csrf` from getElementsByName("_csrf")[3] and
    // the register number from the header text (da_upload.js:77-96); both
    // come from the DA list's own form now.
    const fields = {
      authorizedID: form.elements.authorizedID?.value ?? "",
      x: new Date().toUTCString(),
      classId,
      _csrf: form.elements._csrf?.value ?? "",
    };
    // port: only through the L4 helper (SECURITY.md §4).
    const res = await ns.request.request("examinations/processDigitalAssignment", fields, { xhr: true });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const doc = new DOMParser().parseFromString(await res.text(), "text/html");
    // port: a login page or error page would have parsed as "Nothing Left.";
    // only a real DA page is read.
    if (!doc.querySelector("form#daUpload")) throw new Error("not a DA page");
    show(td, ns.nextDue(readAssignments(doc)));
  }

  // port: the reference awaited one course at a time (da_upload.js:112-206);
  // up to MAX_PARALLEL run at once (PLAN.md M6).
  async function runAll(jobs) {
    const queue = jobs.slice();
    const worker = async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        try {
          await job();
        } catch (error) {
          ns.log("da-dues: course failed", error);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL, queue.length) }, worker));
  }

  ns.register({
    id: ID,
    matches: (root, screen) =>
      screen === "da-list" && Boolean(root.querySelector("form#digitalAssignment table.customTable tr.tableHeader")),
    apply(root) {
      const form = root.querySelector("form#digitalAssignment");
      const table = form.querySelector("table.customTable");
      const header = table.querySelector("tr.tableHeader");
      if (header.querySelector(`[data-viboot="${ID}"]`)) return;

      const head = newCell();
      head.textContent = "Upcoming Dues";
      header.insertBefore(head, header.cells[INSERT_AT] ?? null);

      const jobs = [];
      for (const row of table.querySelectorAll("tr.tableContent")) {
        const td = newCell();
        row.insertBefore(td, row.cells[INSERT_AT] ?? null);
        const classId = row.cells[COL.classId]?.textContent.trim();
        // The reference skipped rows whose title cell has exactly one child
        // element (da_upload.js:114).
        if (!classId || row.cells[COL.title].children.length === 1) continue;
        // port: the reference left the cell blank while loading.
        td.textContent = "…";
        jobs.push(() =>
          fetchDue(form, classId, td).catch((error) => {
            showError(td);
            throw error;
          }),
        );
      }
      ns.log(`da-dues: ${jobs.length} course(s)`);
      runAll(jobs);
    },
  });
})(globalThis.ViBoot);
