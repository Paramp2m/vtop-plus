// The captcha solver, copied from ViBoot's neural solver
// (ref/Viboot/js/captcha/captchaparser.js:97-219). Pure: it takes the RGBA
// pixels of the 200×40 captcha image and returns its 6 characters, so it
// also runs in Node for the unit tests. Reading the pixels off the page is
// content/features/captcha.js's job.
"use strict";

(function (ns) {
  const pre_img = (img) => {
    let avg = 0;
    img.forEach((e) => e.forEach((f) => (avg += f)));
    avg /= 24 * 22;
    var bits = new Array(img.length);
    for (let i = 0; i < img.length; i += 1) {
      bits[i] = new Array(img[0].length);
      for (let j = 0; j < img[0].length; j += 1) {
        if (img[i][j] > avg) {
          bits[i][j] = 1;
        } else {
          bits[i][j] = 0;
        }
      }
    }
    return bits;
  };

  const saturation = (d) => {
    // port: declared with const/let; the reference assigns implicit globals
    // (saturate, min, max, bls, c, d, x1, y1, x2, y2) (captchaparser.js:116-136).
    const saturate = new Array(d.length / 4);
    for (let i = 0; i < d.length; i += 4) {
      const min = Math.min(d[i], d[i + 1], d[i + 2]);
      const max = Math.max(d[i], d[i + 1], d[i + 2]);
      // port: a pure black pixel (max = 0) gave 0/0 = NaN, which made the
      // block's average NaN and every bit 0 (captchaparser.js:120).
      saturate[i / 4] = max === 0 ? 0 : Math.round(((max - min) * 255) / max);
    }
    var img = new Array(40);
    for (let i = 0; i < 40; i += 1) {
      img[i] = new Array(200);
      for (let j = 0; j < 200; j += 1) {
        img[i][j] = saturate[i * 200 + j];
      }
    }
    const bls = new Array(6);
    for (let i = 0; i < 6; i += 1) {
      const x1 = (i + 1) * 25 + 2;
      const y1 = 7 + 5 * (i % 2) + 1;
      const x2 = (i + 2) * 25 + 1;
      const y2 = 35 - 5 * ((i + 1) % 2);
      bls[i] = img.slice(y1, y2).map((i) => i.slice(x1, x2));
    }
    return bls;
  };

  const flatten = (arr) => {
    var bits = new Array(arr.length * arr[0].length);
    for (let i = 0; i < arr.length; i += 1) {
      for (let j = 0; j < arr[0].length; j += 1) {
        bits[i * arr[0].length + j] = arr[i][j];
      }
    }
    return bits;
  };

  const mat_mul = (a, b) => {
    let x = a.length,
      z = a[0].length,
      y = b[0].length;
    let productRow = Array.apply(null, new Array(y)).map(Number.prototype.valueOf, 0);
    let product = new Array(x);
    for (let p = 0; p < x; p++) {
      product[p] = productRow.slice();
    }
    for (let i = 0; i < x; i++) {
      for (let j = 0; j < y; j++) {
        for (let k = 0; k < z; k++) {
          product[i][j] += a[i][k] * b[k][j];
        }
      }
    }
    return product;
  };

  const mat_add = (a, b) => {
    let x = a.length;
    let c = new Array(x);
    for (let i = 0; i < x; i++) {
      c[i] = a[i] + b[i];
    }
    return c;
  };

  const max_soft = (a) => {
    var n = [...a];
    let s = 0;
    n.forEach((f) => {
      s += Math.exp(f);
    });
    for (let i = 0; i < a.length; i++) {
      n[i] = Math.exp(a[i]) / s;
    }
    return n;
  };

  // port: takes the pixels and the model and returns the text; the reference
  // drew the <img> onto a canvas itself and wrote #captchaStr
  // (captchaparser.js:200-207, 219). That part is in content/features/captcha.js.
  ns.solveCaptcha = function solve(data, model) {
    const weights = model.weights;
    const biases = model.biases;
    const label_txt = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let bls = saturation(data);
    let out = "";
    for (let i = 0; i < 6; i += 1) {
      bls[i] = pre_img(bls[i]);
      bls[i] = [flatten(bls[i])];
      bls[i] = mat_mul(bls[i], weights);
      bls[i] = mat_add(...bls[i], biases);
      bls[i] = max_soft(bls[i]);
      bls[i] = bls[i].indexOf(Math.max(...bls[i]));
      out += label_txt[bls[i]];
    }
    return out;
  };
})(globalThis.ViBoot);
