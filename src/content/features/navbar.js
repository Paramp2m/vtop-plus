// Quick-nav bar (PLAN.md M3), from ViBoot's nav_bar_change
// (ref/Viboot/js/navbar.js:1-57). Puts Marks View, Attendance, Course Page
// and DA Upload buttons in the header; each one clicks the matching left-menu
// item, so VTOP loads the screen itself.
"use strict";

(function (ns) {
  const ID = "navbar";
  const BAR_ID = "vtop-plus-navbar";

  // port: the reference found each menu link by its text and stored its index
  // in the list of a[data-url] (navbar.js:2-21). Indexes shift with the
  // student's Quick Links (analysis §3.4), so each button names its link by
  // data-url instead (values from Home_page.html). Order and labels are the
  // reference's (navbar.js:29-41).
  const BUTTONS = [
    { key: "marks", label: "Marks View", url: "examinations/StudentMarkView" },
    { key: "attendance", label: "Attendance", url: "academics/common/StudentAttendance" },
    { key: "course-page", label: "Course Page", url: "academics/common/CoursePageConsolidated" },
    { key: "da-upload", label: "DA Upload", url: "examinations/StudentDA" },
  ];
  // port: the reference's fifth button, Time Table (or Calendar when there's
  // no Time Table link, navbar.js:38-41), is left out at the student's
  // request (2026-10-15).

  // port: only the left menu's own links (systemB5BtnMenu, or systemBtnMenu
  // for the older B3 screens such as Calendar), whose click handlers load the
  // screen (Home_page.html, connectMenus). The Quick Links dropdown repeats
  // some data-urls with other classes, and Calendar appears twice.
  function menuLink(url) {
    return document.querySelector(`a.systemB5BtnMenu[data-url="${url}"], a.systemBtnMenu[data-url="${url}"]`);
  }

  function makeButton(target, buttons) {
    const button = document.createElement("button");
    // port: the reference gave every button id="nav_short" and inline styles
    // (navbar.js:29-41); each now has its own id, and the styles are in
    // viboot.css.
    button.id = `vtop-plus-nav-${target.key}`;
    button.className = "btn btn-primary border-primary shadow-none";
    button.type = "button";
    button.dataset.url = target.url;
    button.textContent = target.label;
    // port: the reference clicked the link from an inline onclick string
    // (navbar.js:29-41). A listener in the content script does the same:
    // click() dispatches a real click event, so VTOP's own handler
    // (assembleData) loads the screen. The link is looked up at click time,
    // so a re-drawn menu doesn't leave a stale reference.
    button.addEventListener("click", () => {
      const link = menuLink(target.url);
      if (!link) {
        ns.log(`navbar: menu link ${target.url} is gone`);
        return;
      }
      // Every button is disabled for 1.5 s after a click, so a double click
      // doesn't load the screen twice (navbar.js:44-56).
      for (const b of buttons) b.disabled = true;
      setTimeout(() => {
        for (const b of buttons) b.disabled = false;
      }, 1500);
      link.click();
    });
    return button;
  }

  ns.register({
    id: ID,
    matches: (root) => Boolean(root.getElementById("vtopHeaderBarControl")) && !root.getElementById(BAR_ID),
    apply(root) {
      const header = root.getElementById("vtopHeaderBarControl");
      // port: a button whose menu link is missing isn't shown; the reference
      // showed it and its click threw. If the menu isn't there at all yet,
      // nothing is added and the router's next run tries again.
      const present = BUTTONS.filter((t) => menuLink(t.url));
      if (present.length === 0) return;

      const bar = document.createElement("div");
      bar.id = BAR_ID;
      bar.dataset.viboot = ID;
      const spacer = document.createElement("span");
      spacer.className = "navbar-text px-0 px-sm-2 mx-0 mx-sm-1 text-light";
      bar.append(spacer);
      const buttons = [];
      for (const target of present) buttons.push(makeButton(target, buttons));
      bar.append(...buttons);
      // Before #quickLinks, the header's first child (navbar.js:23, 42).
      header.insertBefore(bar, root.getElementById("quickLinks") || header.firstChild);
      ns.log(`navbar: ${present.map((t) => t.key).join(", ")}`);
    },
  });
})(globalThis.ViBoot);
