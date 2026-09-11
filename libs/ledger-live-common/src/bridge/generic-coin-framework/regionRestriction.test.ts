import { isRegionRestrictedFailure } from "./regionRestriction";

describe("isRegionRestrictedFailure", () => {
  it("recognises the compliance page answering the replayed request", () => {
    expect(isRegionRestrictedFailure({ status: 405 }, "hypercore")).toBe(true);
  });

  it("ignores the same status for a family that is not behind the compliance layer", () => {
    expect(isRegionRestrictedFailure({ status: 405 }, "evm")).toBe(false);
  });

  it("ignores other failures of an opted-in family", () => {
    expect(isRegionRestrictedFailure({ status: 500 }, "hypercore")).toBe(false);
    expect(isRegionRestrictedFailure(new Error("network down"), "hypercore")).toBe(false);
    expect(isRegionRestrictedFailure(undefined, "hypercore")).toBe(false);
  });
});
