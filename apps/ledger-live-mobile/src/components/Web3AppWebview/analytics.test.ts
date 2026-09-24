import { resetTrackingPages, setTrackingSource } from "~/analytics/screenRefs";
import { getTrackingRouteLiveAppSource } from "./analytics";

describe("getTrackingRouteLiveAppSource", () => {
  afterEach(resetTrackingPages);

  it("maps Platform Catalog to Discover", () => {
    setTrackingSource("Platform Catalog");

    expect(getTrackingRouteLiveAppSource()).toBe("Discover");
  });

  it("returns the current tracking page", () => {
    setTrackingSource("Portfolio");

    expect(getTrackingRouteLiveAppSource()).toBe("Portfolio");
  });

  it("returns Unknown when the current tracking page is unset", () => {
    setTrackingSource();

    expect(getTrackingRouteLiveAppSource()).toBe("Unknown");
  });
});
