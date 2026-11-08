import { describe, expect, test } from "bun:test";
import { fitImageMapFrame, IMAGE_MAP_FRAME } from "./map-frame";

describe("saved image-map coordinate frame", () => {
  test("preserves the original saved canvas without moving points", () => {
    expect(fitImageMapFrame(1358, 843)).toEqual({ left: 0, top: 0, width: 1358, height: 843 });
  });
  test("photo landmarks and saved routes scale identically across viewports", () => {
    for (const [width, height] of [[799.328125, 525.5], [1250, 750], [390, 600], [1920, 1080]]) {
      const frame = fitImageMapFrame(width, height);
      expect(frame.width / frame.height).toBeCloseTo(1358 / 843, 10);
      const scale = frame.width / IMAGE_MAP_FRAME.width;
      // A landmark at (612, 745) and its saved annotation must coincide.
      expect(frame.left + frame.width * (612 / 1358)).toBeCloseTo(frame.left + 612 * scale, 10);
      expect(frame.top + frame.height * (745 / 843)).toBeCloseTo(frame.top + 745 * scale, 10);
      expect(frame.left).toBeGreaterThanOrEqual(0);
      expect(frame.top).toBeGreaterThanOrEqual(0);
      expect(frame.width).toBeLessThanOrEqual(width);
      expect(frame.height).toBeLessThanOrEqual(height);
    }
  });
  test("waits for a measurable map surface", () => {
    expect(fitImageMapFrame(0, 0)).toEqual({ left: 0, top: 0, width: 0, height: 0 });
  });
});