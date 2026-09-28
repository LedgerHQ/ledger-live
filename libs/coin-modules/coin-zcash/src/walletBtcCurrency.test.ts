import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { getEnv } from "@ledgerhq/live-env";
import { toWalletBtcCurrency } from "./walletBtcCurrency";

describe("toWalletBtcCurrency", () => {
  it("uses the explorer id from the coin config", () => {
    expect(toWalletBtcCurrency(getCryptoCurrencyById("zcash"), { explorerId: "zec" })).toEqual({
      id: "zcash",
      explorerId: "zec",
      explorerEndpoint: getEnv("EXPLORER"),
    });
  });

  it("falls back to the currency id when the coin config has no explorer id", () => {
    expect(toWalletBtcCurrency(getCryptoCurrencyById("zcash_regtest"), {}).explorerId).toBe(
      "zcash_regtest",
    );
  });
});
