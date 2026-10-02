import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { toWalletBtcCurrency } from "./walletBtcCurrency";

const explorer = { url: "https://explorer.example" };

describe("toWalletBtcCurrency", () => {
  it("uses the explorer id and endpoint from the coin config", () => {
    expect(
      toWalletBtcCurrency(getCryptoCurrencyById("zcash"), { explorerId: "zec", explorer }),
    ).toEqual({
      id: "zcash",
      explorerId: "zec",
      explorerEndpoint: "https://explorer.example",
    });
  });

  it("falls back to the currency id when the coin config has no explorer id", () => {
    expect(
      toWalletBtcCurrency(getCryptoCurrencyById("zcash_regtest"), { explorer }).explorerId,
    ).toBe("zcash_regtest");
  });
});
