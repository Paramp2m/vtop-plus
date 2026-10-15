// Names the VTOP screen currently showing. VTOP swaps #main-section by AJAX,
// so the URL doesn't say which screen this is; each screen's own <form> does.
// Markers were confirmed against fixtures/ (one fixture per screen, and each
// marker appears in no other fixture).
"use strict";

(function (ns) {
  // First match wins. The login checks come first because the image-captcha
  // page also has #vtopLoginForm.
  const SCREENS = [
    ["login-captcha", "#captchaBlock img"],
    ["login-recaptcha", "#vtopLoginForm"],
    ["da-course", "form#daUpload"],
    ["da-list", "form#digitalAssignment"],
    ["attendance", "form#viewStudentAttendance"],
    ["marks", "form#studentMarkView"],
    ["course-page", "form#coursePageView"],
    ["time-table", "form#studentTimeTable"],
    ["exam-schedule", "form#examSchedule"],
  ];

  // Returns a screen name, or null when it can't tell yet (for example while
  // a new screen is loading into #main-section, or on a screen VTOP Plus
  // doesn't use).
  ns.screen = function screen(root) {
    for (const [name, selector] of SCREENS) {
      if (root.querySelector(selector)) return name;
    }
    // Home has the page wrapper but no #main-section.
    if (root.querySelector("#b5-pagewrapper") && !root.querySelector("#main-section")) {
      return "home";
    }
    return null;
  };
})(globalThis.ViBoot);
