import { SYNC_TYPE_SHIELDED, SYNC_TYPE_TRANSPARENT } from "@ledgerhq/types-live";
import { legacySyncConfig } from "./syncConfig";

describe("legacySyncConfig", () => {
  it("syncs every page with the blacklisted tokens left out", () => {
    expect(legacySyncConfig("ethereum", ["blacklisted"])).toEqual({
      paginationConfig: {},
      blacklistedTokenIds: ["blacklisted"],
    });
  });

  it("syncs the shielded part of a zcash account too", () => {
    expect(legacySyncConfig("zcash", [])).toEqual({
      paginationConfig: {},
      blacklistedTokenIds: [],
      syncType: SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED,
    });
  });
});
