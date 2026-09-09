import { describe, expect, it } from "@jest/globals";
import { LIVE_APP_PARTITION, getLiveAppPartition } from "./liveAppSession";

describe("getLiveAppPartition", () => {
  it("never returns an empty partition, which would mean the host's default session", () => {
    // DONJON-1404: an omitted `partition` attribute puts a Live App guest in
    // the same session as the host renderer.
    expect(getLiveAppPartition({ id: "any-app" })).toBe(LIVE_APP_PARTITION);
  });

  it("keys the partition to the manifest id and cacheBustingId when one is pinned", () => {
    expect(getLiveAppPartition({ id: "my-app", cacheBustingId: 2 })).toBe("persist:myapp-2");
  });

  it("strips non-alphanumeric characters from the manifest id", () => {
    expect(getLiveAppPartition({ id: "my.app_v2!", cacheBustingId: 1 })).toBe("persist:myappv2-1");
  });

  it("changes partition when cacheBustingId is bumped, resetting the app's storage", () => {
    expect(getLiveAppPartition({ id: "app", cacheBustingId: 1 })).not.toBe(
      getLiveAppPartition({ id: "app", cacheBustingId: 2 }),
    );
  });

  it("treats cacheBustingId 0 as a pinned partition rather than a missing one", () => {
    expect(getLiveAppPartition({ id: "app", cacheBustingId: 0 })).toBe("persist:app-0");
  });

  it("only ever produces persistent partitions", () => {
    expect(LIVE_APP_PARTITION.startsWith("persist:")).toBe(true);
    expect(getLiveAppPartition({ id: "app", cacheBustingId: 3 }).startsWith("persist:")).toBe(true);
  });
});
