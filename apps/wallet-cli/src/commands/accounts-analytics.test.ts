import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import * as analytics from "@shared/analytics";
import { trackOperationViewed } from "./accounts-analytics";

// spyOn instead of mock.module: a module mock is global and would leak into segment.test.ts.
let trackSpy: ReturnType<typeof spyOn<typeof analytics, "track">>;

describe("accounts analytics", () => {
  beforeEach(() => {
    trackSpy = spyOn(analytics, "track").mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    trackSpy.mockRestore();
  });

  it("operation_viewed sends a hasCursor flag and no cursor property", () => {
    trackOperationViewed({ network: "ethereum", limit: 5, hasCursor: true });

    expect(trackSpy.mock.calls).toEqual([
      [
        "operation_viewed",
        { page: "Account - Operations", network: "ethereum", limit: 5, hasCursor: true },
      ],
    ]);
  });
});
