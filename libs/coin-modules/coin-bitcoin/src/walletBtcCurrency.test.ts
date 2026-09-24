import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { setCoinConfig } from "./config";
import { toWalletBtcCurrency, walletBtcCurrencyById } from "./walletBtcCurrency";

const explorerOf = (currencyId: string) => `https://${currencyId}.explorer.test`;

beforeAll(() =>
  setCoinConfig(currencyId => ({
    info: { status: { type: "active" }, infra: { EXPLORER: explorerOf(currencyId) } },
  })),
);

describe("toWalletBtcCurrency", () => {
  it("takes the explorer endpoint from the currency's own coin config", () => {
    expect(toWalletBtcCurrency(getCryptoCurrencyById("litecoin"))).toEqual({
      id: "litecoin",
      explorerId: "ltc",
      explorerEndpoint: explorerOf("litecoin"),
    });
  });

  it("names the regtest explorer btc_regtest", () => {
    expect(walletBtcCurrencyById("bitcoin_regtest")).toEqual({
      id: "bitcoin_regtest",
      explorerId: "btc_regtest",
      explorerEndpoint: explorerOf("bitcoin_regtest"),
    });
  });
});
