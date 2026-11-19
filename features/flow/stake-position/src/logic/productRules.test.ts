import { selectNotice } from "./productRules";

describe("selectNotice", () => {
  it("should say the position is updating while the backend has not shown the user's own transaction", () => {
    expect(selectNotice({ isPolling: true, chainNotice: "deactivating", isOutOfDate: false })).toBe(
      "updating",
    );
  });

  it.each(["deactivating", "missingAuthority"] as const)(
    "should explain the %s chain notice before out-of-date details",
    chainNotice => {
      expect(selectNotice({ isPolling: false, chainNotice, isOutOfDate: true })).toBe(chainNotice);
    },
  );

  it("should say the position is updating when its details may be out of date", () => {
    expect(selectNotice({ isPolling: false, chainNotice: null, isOutOfDate: true })).toBe(
      "updating",
    );
  });

  it("should show no notice otherwise", () => {
    expect(selectNotice({ isPolling: false, chainNotice: null, isOutOfDate: false })).toBeNull();
  });
});
