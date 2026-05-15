import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { buildMainAccountByIdMap, lookupParentAccountFromMap } from "../parentAccountLookup";

const mainAccount = (id: string): Account => ({ id, type: "Account" }) as unknown as Account;
const tokenAccount = (id: string, parentId: string): TokenAccount =>
  ({ id, parentId, type: "TokenAccount" }) as unknown as TokenAccount;

describe("buildMainAccountByIdMap", () => {
  it("indexes only main accounts by id", () => {
    const accounts: AccountLike[] = [
      mainAccount("eth-1"),
      tokenAccount("eth-1|0", "eth-1"),
      mainAccount("btc-1"),
    ];
    const map = buildMainAccountByIdMap(accounts);
    expect(map.size).toBe(2);
    expect(map.get("eth-1")?.id).toBe("eth-1");
    expect(map.get("btc-1")?.id).toBe("btc-1");
    expect(map.get("eth-1|0")).toBeUndefined();
  });
});

describe("lookupParentAccountFromMap", () => {
  it("returns the account or null", () => {
    const map = buildMainAccountByIdMap([mainAccount("eth-1")]);
    expect(lookupParentAccountFromMap(map, "eth-1")?.id).toBe("eth-1");
    expect(lookupParentAccountFromMap(map, "missing")).toBeNull();
  });
});
