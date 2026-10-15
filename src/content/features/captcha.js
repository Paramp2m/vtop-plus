// CAPTCHA auto-fill (PLAN.md M2), from ViBoot's myMain/solve
// (ref/Viboot/js/captcha/captchaparser.js:200-207, 219, 239-247). On the
// image-captcha login page it reads the captcha, writes the answer into
// #captchaStr and focuses Submit. It never submits: the student logs in.
"use strict";

(function (ns) {
  const ID = "captcha";
  const ANSWER = /^[A-HJ-NP-Z2-9]{6}$/; // 6 characters of the solver's alphabet

  // port: the reference drew the image in solve() itself, once, on window
  // `load` (captchaparser.js:204-207, 250). `load` may already have fired at
  // document_idle (analysis §10, probe 1), so wait for the image to decode.
  async function pixels(img) {
    await img.decode();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, 200, 40).data;
  }

  async function solveImage(img) {
    const data = await pixels(img);
    // port: ↻ may have replaced the image while it decoded; its own run
    // fills the field instead.
    if (!img.isConnected) return;
    const answer = ns.solveCaptcha(data, ns.captchaModel);
    if (!ANSWER.test(answer)) {
      ns.log(`captcha: unexpected answer "${answer}", left blank`);
      return;
    }
    const textB = document.getElementById("captchaStr");
    if (!textB) return;
    textB.value = answer;
    // port: the reference set .value only (captchaparser.js:219); fire `input`
    // so anything listening on the field sees the change.
    textB.dispatchEvent(new Event("input", { bubbles: true }));
    // port: #submitBtn doesn't exist on today's page, so the reference's
    // focus() threw (captchaparser.js:244, 246; analysis §3.6). Submit is the
    // form's button.btn-primary. Focus is left alone while the student is
    // typing in a field, so a refill never pulls them out of it.
    const submitB = document.querySelector("#vtopLoginForm button.btn-primary");
    const typing = document.activeElement?.matches?.("input, textarea, select");
    if (submitB && !typing) submitB.focus();
    ns.log("captcha: filled");
  }

  ns.register({
    id: ID,
    matches: (root, screen) => screen === "login-captcha" && Boolean(ns.captchaModel),
    // port: one run per <img>, marked data-viboot="captcha". ↻ (loadCaptcha)
    // replaces #captchaBlock's contents with a fresh <img>, which the router's
    // observer picks up, so the new image is solved too; the reference solved
    // only once (captchaparser.js:250; analysis §3.6).
    apply(root) {
      const img = root.querySelector("#captchaBlock img");
      if (!img || img.dataset.viboot === ID) return;
      img.dataset.viboot = ID;
      solveImage(img).catch((error) => ns.log("captcha: failed", error));
    },
  });
})(globalThis.ViBoot);
