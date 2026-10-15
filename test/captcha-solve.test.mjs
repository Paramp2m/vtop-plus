// The captcha solver (src/lib/captcha-solve.js) on synthetic input. The real
// captchas are checked in the browser against the login fixtures (PLAN.md M2).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const SRC = new URL("../src/", import.meta.url);
const ctx = { console };
ctx.globalThis = ctx;
for (const f of ["lib/ns.js", "lib/captcha-solve.js", "content/captcha/model.js"]) {
  runInNewContext(readFileSync(new URL(f, SRC), "utf8"), ctx);
}
const { solveCaptcha, captchaModel } = ctx.ViBoot;
const ALPHABET = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

const image = (pixel) => {
  const data = new Uint8ClampedArray(200 * 40 * 4);
  for (let p = 0; p < 200 * 40; p += 1) data.set([...pixel(p % 200, Math.floor(p / 200)), 255], p * 4);
  return data;
};

test("the model has the reference's shape", () => {
  assert.equal(captchaModel.weights.length, 528);
  assert.ok(captchaModel.weights.every((row) => row.length === 32));
  assert.equal(captchaModel.biases.length, 32);
});

test("all-black input gives 6 letters, not NaN (max = 0 guard)", () => {
  assert.match(solveCaptcha(image(() => [0, 0, 0]), captchaModel), ALPHABET);
});

test("any input gives 6 characters from the alphabet", () => {
  let seed = 7;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) % 256;
  const inputs = [
    image(() => [255, 255, 255]),
    image((x, y) => ((x + y) % 7 ? [255, 255, 255] : [200, 30, 30])),
    image(() => [rand(), rand(), rand()]),
  ];
  for (const data of inputs) assert.match(solveCaptcha(data, captchaModel), ALPHABET);
});

test("the solver doesn't leak globals", () => {
  for (const name of ["saturate", "min", "max", "bls", "out", "x1", "y2"]) assert.ok(!(name in ctx), name);
});
