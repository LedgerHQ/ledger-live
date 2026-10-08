import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "../../modularDrawer/__mocks__/currencies.mock";
import { getDepositMaxBuffer } from "./depositMaxBuffer";

const ethereum = getCryptoCurrencyById("ethereum");
const ethAccount = genAccount("eth-1", { currency: ethereum, operationsSize: 0 });
const usdcAccount = genTokenAccount(0, ethAccount, usdcToken);

describe("getDepositMaxBuffer", () => {
  it("holds back the configured amount of a native coin, in its smallest unit", () => {
    expect(getDepositMaxBuffer(ethAccount, { ethereum: "0.01" }).toFixed()).toBe(
      "10000000000000000",
    );
  });

  // A token's fee is paid by its parent's native coin, not out of the token balance.
  it("holds nothing back for a token account", () => {
    expect(getDepositMaxBuffer(usdcAccount, { ethereum: "0.01" }).isZero()).toBe(true);
  });

  it.each([
    ["no constant for the currency", { bitcoin: "0.0001" }],
    ["no constants at all", undefined],
    ["a malformed constant", { ethereum: "abc" }],
    ["a negative constant", { ethereum: "-1" }],
  ])("holds nothing back with %s", (_case, constants) => {
    expect(getDepositMaxBuffer(ethAccount, constants).isZero()).toBe(true);
  });
});
