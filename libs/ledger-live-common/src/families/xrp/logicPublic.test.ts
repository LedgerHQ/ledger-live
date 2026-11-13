import { MAX_TRUST_LIMIT } from "@ledgerhq/coin-xrp/logic-public";
import { getMaxTrustLimitForToken } from "./logicPublic";

describe("getMaxTrustLimitForToken", () => {
  it("returns the protocol maximum, in base units", () => {
    expect(getMaxTrustLimitForToken().toFixed()).toBe(MAX_TRUST_LIMIT.toString());
  });
});
