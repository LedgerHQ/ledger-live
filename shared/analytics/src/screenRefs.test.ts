import {
  getCurrentTrackingPage,
  getPreviousTrackingPage,
  resetTrackingPages,
  setTrackingSource,
} from "./screenRefs";
import { updateTrackingPages } from "./internals/screenRefs.internals";

beforeEach(resetTrackingPages);

describe("screenRefs", () => {
  it("normalizes an unknown page to an empty string", () => {
    expect(getCurrentTrackingPage()).toBe("");
    expect(getPreviousTrackingPage()).toBe("");
  });

  it("uses the requested fallback for an unknown page", () => {
    expect(getCurrentTrackingPage({ fallback: "Unknown" })).toBe("Unknown");
    expect(getPreviousTrackingPage({ fallback: "Unknown" })).toBe("Unknown");
  });

  it("does not replace an empty tracking page with the fallback", () => {
    setTrackingSource("");
    updateTrackingPages("Market", true);

    expect(getPreviousTrackingPage({ fallback: "Unknown" })).toBe("");
  });

  it("reads the tracking pages through the getters", () => {
    setTrackingSource("Portfolio");
    updateTrackingPages("Market", true);

    expect(getCurrentTrackingPage()).toBe("Market");
    expect(getPreviousTrackingPage()).toBe("Portfolio");
  });

  it("overrides the current page through setTrackingSource", () => {
    setTrackingSource("Send Flow");

    expect(getCurrentTrackingPage()).toBe("Send Flow");
  });

  it("clears the current page when setTrackingSource is called without a source", () => {
    setTrackingSource("Send Flow");

    setTrackingSource();

    expect(getCurrentTrackingPage()).toBe("");
  });

  it("resets the current and previous tracking pages", () => {
    setTrackingSource("Portfolio");
    updateTrackingPages("Market", true);

    resetTrackingPages();

    expect(getCurrentTrackingPage()).toBe("");
    expect(getPreviousTrackingPage()).toBe("");
  });
});
