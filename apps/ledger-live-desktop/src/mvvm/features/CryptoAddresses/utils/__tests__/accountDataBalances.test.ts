import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { AccountAssetBalance } from "@domain/entity-account-balance";
import {
  computeAccountDataAggregatedAccounts,
  getAccountDataNativeBalance,
} from "../accountDataBalances";

const account = {
  id: "js:2:ethereum:0xabc:",
  currency: { id: "ethereum" },
  balance: new BigNumber(5),
  subAccounts: [{ token: { id: "ethereum/erc20/usdt" }, balance: new BigNumber(7) }],
} as unknown as Account;

const rows = [
  { assetId: "ethereum", balance: "100", spendableBalance: "100" },
  { assetId: "ethereum/erc20/usdt", balance: "30", spendableBalance: "30" },
] as AccountAssetBalance[];

const identity = (_from: unknown, value: BigNumber) => value;

describe("accountDataBalances", () => {
  it("sums the stored native and token balances", () => {
    const result = computeAccountDataAggregatedAccounts(
      [account],
      new Map([[account.id, rows]]),
      identity,
    );
    expect(result.get(account.id)?.countervalue.toFixed()).toBe("130");
    expect(result.get(account.id)?.subAccountsCount).toBe(1);
  });

  it("falls back to the account's own balances before the read lands", () => {
    const result = computeAccountDataAggregatedAccounts([account], new Map(), identity);
    expect(result.get(account.id)?.countervalue.toFixed()).toBe("12");
  });

  it("falls back per asset when a row is missing", () => {
    const result = computeAccountDataAggregatedAccounts(
      [account],
      new Map([[account.id, [rows[0]]]]),
      identity,
    );
    expect(result.get(account.id)?.countervalue.toFixed()).toBe("107");
  });

  it("treats a missing countervalue as zero", () => {
    const result = computeAccountDataAggregatedAccounts(
      [account],
      new Map([[account.id, rows]]),
      () => undefined,
    );
    expect(result.get(account.id)?.countervalue.toFixed()).toBe("0");
  });

  it("reads the native balance from the stored rows", () => {
    expect(getAccountDataNativeBalance(account, rows).toFixed()).toBe("100");
    expect(getAccountDataNativeBalance(account, undefined).toFixed()).toBe("5");
  });
});
