import { resetTrackingPages, setTrackingSource } from "~/renderer/analytics/screenRefs";
import { getTrackingRouteLiveAppSource } from "./analytics";

describe("getTrackingRouteLiveAppSource", () => {
  afterEach(() => {
    resetTrackingPages();
  });

  it("maps the platform catalog route to Discover", () => {
    setTrackingSource("Platform Catalog");

    expect(getTrackingRouteLiveAppSource()).toBe("Discover");
  });

  it("keeps other tracking routes unchanged", () => {
    setTrackingSource("Portfolio");

    expect(getTrackingRouteLiveAppSource()).toBe("Portfolio");
  });

  it("falls back to Unknown when no route is tracked", () => {
    setTrackingSource();

    expect(getTrackingRouteLiveAppSource()).toBe("Unknown");
  });
});
