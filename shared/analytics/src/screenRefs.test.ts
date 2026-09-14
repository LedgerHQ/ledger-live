import {
  currentRouteNameRef,
  getCurrentTrackingPage,
  getPreviousTrackingPage,
  previousRouteNameRef,
  setTrackingSource,
} from "./screenRefs";

beforeEach(() => {
  currentRouteNameRef.current = undefined;
  previousRouteNameRef.current = undefined;
});

describe("screenRefs", () => {
  it("normalizes an unknown page to an empty string", () => {
    expect(getCurrentTrackingPage()).toBe("");
    expect(getPreviousTrackingPage()).toBe("");
  });

  it("normalizes a null page to an empty string", () => {
    currentRouteNameRef.current = null;

    expect(getCurrentTrackingPage()).toBe("");
  });

  it("reads the refs through the getters", () => {
    currentRouteNameRef.current = "Market";
    previousRouteNameRef.current = "Portfolio";

    expect(getCurrentTrackingPage()).toBe("Market");
    expect(getPreviousTrackingPage()).toBe("Portfolio");
  });

  it("overrides the current page through setTrackingSource", () => {
    setTrackingSource("Send Flow");

    expect(currentRouteNameRef.current).toBe("Send Flow");
  });

  it("clears the current page when setTrackingSource is called without a source", () => {
    currentRouteNameRef.current = "Send Flow";

    setTrackingSource();

    expect(getCurrentTrackingPage()).toBe("");
  });
});
