import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { toWalletBtcCurrency } from "./walletBtcCurrency";

const explorer = { url: "https://explorer.example" };

describe("toWalletBtcCurrency", () => {
  it("uses the explorer id and endpoint from the coin config", () => {
    expect(
      toWalletBtcCurrency(getCryptoCurrencyById("bitcoin"), { explorerId: "btc", explorer }),
    ).toEqual({
      id: "bitcoin",
      explorerId: "btc",
      explorerEndpoint: "https://explorer.example",
    });
  });

  it("falls back to the currency id when the coin config has no explorer id", () => {
    expect(toWalletBtcCurrency(getCryptoCurrencyById("dash"), { explorer }).explorerId).toBe(
      "dash",
    );
  });

  it("injects the explorer batch size when the coin config sets one", () => {
    expect(
      toWalletBtcCurrency(getCryptoCurrencyById("bitcoin"), {
        explorer: { ...explorer, batchSize: 250 },
      }).explorerBatchSize,
    ).toBe(250);
  });
});
