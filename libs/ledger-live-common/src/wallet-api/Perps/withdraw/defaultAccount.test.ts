import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { pickDefaultWithdrawAccount } from "./defaultAccount";

const account = (id: string, currencyId: string): AccountLike =>
  ({ type: "Account", id, currency: { id: currencyId } }) as unknown as AccountLike;

const eth = account("eth-1", "ethereum");
const ethRich = account("eth-2", "ethereum");
const btc = account("btc-1", "bitcoin");
const doge = account("doge-1", "dogecoin");

const fiat: Record<string, number> = { "eth-1": 10, "eth-2": 500, "btc-1": 200, "doge-1": 9000 };
const getFiatBalance = (acc: AccountLike) =>
  fiat[acc.id] === undefined ? undefined : new BigNumber(fiat[acc.id] ?? 0);

describe("pickDefaultWithdrawAccount", () => {
  it("picks the supported account with the highest fiat balance", () => {
    expect(
      pickDefaultWithdrawAccount({
        accounts: [eth, ethRich, btc, doge],
        supportedCurrencyIds: ["ethereum", "bitcoin"],
        getFiatBalance,
      }),
    ).toBe(ethRich);
  });

  it("ignores accounts whose asset cannot be withdrawn to", () => {
    expect(
      pickDefaultWithdrawAccount({
        accounts: [doge, btc],
        supportedCurrencyIds: ["bitcoin"],
        getFiatBalance,
      }),
    ).toBe(btc);
  });

  it("treats an unpriced account as zero", () => {
    expect(
      pickDefaultWithdrawAccount({
        accounts: [account("sol-1", "solana"), eth],
        supportedCurrencyIds: ["solana", "ethereum"],
        getFiatBalance,
      }),
    ).toBe(eth);
  });

  it("returns undefined when no account matches", () => {
    expect(
      pickDefaultWithdrawAccount({
        accounts: [doge],
        supportedCurrencyIds: ["ethereum"],
        getFiatBalance,
      }),
    ).toBeUndefined();
  });
});
