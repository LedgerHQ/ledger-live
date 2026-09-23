import "./test-helpers/staticTime";
import { setEnv } from "@shared/env";
import { genAccount } from "../mock/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { accountsOpToCSV } from "../csvExport";
import { initialState } from "@ledgerhq/live-countervalues/logic";
import { loadCountervalues } from "@domain/api-market-countervalues";
import { createMockRateSource } from "@domain/api-market-countervalues/mock";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";

// Setup mock store for unit tests
setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "",
});
setEnv("MOCK", "1");

const rates = createMockRateSource("1");
test("export CSV", async () => {
  const fiatCurrency = getFiatCurrencyByTicker("USD");
  const currencies = ["bitcoin", "ethereum", "ripple"].map(getCryptoCurrencyById);
  const state = await loadCountervalues(
    initialState,
    {
      trackingPairs: currencies.map(currency => ({
        from: currency,
        to: fiatCurrency,
        startDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
      })),
      autofillGaps: false,
      refreshRate: 60000,
      marketCapBatchingAfterRank: 20,
    },
    { rates },
  );
  const accounts = currencies.map(currency =>
    genAccount(`${currency.id}_export`, {
      currency,
    }),
  );
  expect(accountsOpToCSV(accounts, fiatCurrency, state)).toMatchSnapshot();
});
