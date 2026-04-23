import { ETH_ACCOUNT_WITH_USDC } from "LLD/features/__mocks__/accounts.mock";
import { buildMainAccountByIdMap, lookupParentAccountFromMap } from "../parentAccountLookup";

describe("parentAccountLookup", () => {
  describe("buildMainAccountByIdMap", () => {
    it("indexes only main accounts by id", () => {
      const parent = ETH_ACCOUNT_WITH_USDC;
      const token = parent.subAccounts![0];
      const map = buildMainAccountByIdMap([parent, token]);

      expect(map.get(parent.id)).toBe(parent);
      expect(map.has(token.id)).toBe(false);
    });
  });

  describe("lookupParentAccountFromMap", () => {
    it("returns the account for a known id and null otherwise", () => {
      const parent = ETH_ACCOUNT_WITH_USDC;
      const map = buildMainAccountByIdMap([parent]);

      expect(lookupParentAccountFromMap(map, parent.id)).toBe(parent);
      expect(lookupParentAccountFromMap(map, "unknown")).toBeNull();
    });
  });
});
