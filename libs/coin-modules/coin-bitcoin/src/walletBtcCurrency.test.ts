import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { getEnv } from "@ledgerhq/live-env";
import { toWalletBtcCurrency } from "./walletBtcCurrency";

describe("toWalletBtcCurrency", () => {
  it("uses the explorer id from the coin config", () => {
    expect(toWalletBtcCurrency(getCryptoCurrencyById("bitcoin"), { explorerId: "btc" })).toEqual({
      id: "bitcoin",
      explorerId: "btc",
      explorerEndpoint: getEnv("EXPLORER"),
    });
  });

  it("falls back to the currency id when the coin config has no explorer id", () => {
    expect(toWalletBtcCurrency(getCryptoCurrencyById("dash"), {}).explorerId).toBe("dash");
  });

  it("targets the local regtest explorer for bitcoin_regtest", () => {
    expect(toWalletBtcCurrency(getCryptoCurrencyById("bitcoin_regtest"), {})).toEqual({
      id: "bitcoin_regtest",
      explorerId: "btc_regtest",
      explorerEndpoint: getEnv("EXPLORER_REGTEST"),
    });
  });
});
