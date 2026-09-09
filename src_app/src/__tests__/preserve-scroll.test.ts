import { describe, expect, it } from "vitest";

import { getMinimumViewHeightToPreserveScroll } from "../lib/preserve-scroll";

describe("preserved view height", () => {
  it("reserves enough height when the replacement view is shorter", () => {
    expect(getMinimumViewHeightToPreserveScroll({
      documentHeight: 2400,
      naturalViewHeight: 500,
      renderedViewHeight: 1200,
      scrollY: 1600,
      viewportHeight: 800,
    })).toBe(1200);
  });

  it("uses the natural height when the scroll position already fits", () => {
    expect(getMinimumViewHeightToPreserveScroll({
      documentHeight: 2400,
      naturalViewHeight: 500,
      renderedViewHeight: 1200,
      scrollY: 800,
      viewportHeight: 800,
    })).toBe(500);
  });
});
