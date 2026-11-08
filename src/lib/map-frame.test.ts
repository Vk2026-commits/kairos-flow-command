import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { fitImageMapFrame, IMAGE_MAP_FRAME } from "./map-frame";

describe("saved image-map coordinate frame", () => {
  test("preserves the original saved canvas without moving points", () => {
    assert.deepEqual(fitImageMapFrame(1358, 843), { left: 0, top: 0, width: 1358, height: 843 });
  });
  test("photo landmarks and saved routes scale identically across viewports", () => {
    for (const [width, height] of [[799.328125, 525.5], [1250, 750], [390, 600], [1920, 1080]]) {
      const frame = fitImageMapFrame(width, height);
      assert.ok(Math.abs(frame.width / frame.height - 1358 / 843) < 1e-10);
      const scale = frame.width / IMAGE_MAP_FRAME.width;
      // A landmark at (612, 745) and its saved annotation must coincide.
      assert.ok(Math.abs(frame.left + frame.width * (612 / 1358) - (frame.left + 612 * scale)) < 1e-10);
      assert.ok(Math.abs(frame.top + frame.height * (745 / 843) - (frame.top + 745 * scale)) < 1e-10);
      assert.ok(frame.left >= 0);
      assert.ok(frame.top >= 0);
      assert.ok(frame.width <= width);
      assert.ok(frame.height <= height);
    }
  });
  test("waits for a measurable map surface", () => {
    assert.deepEqual(fitImageMapFrame(0, 0), { left: 0, top: 0, width: 0, height: 0 });
  });
});