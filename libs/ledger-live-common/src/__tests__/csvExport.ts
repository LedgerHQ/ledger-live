import "./test-helpers/staticTime";
import { setEnv } from "@ledgerhq/live-env";
import { genAccount } from "../mock/account";
import { getCryptoCurrencyById } from "../currencies";
import { accountsOpToCSV } from "../csvExport";
import { initialState, loadCountervalues } from "@ledgerhq/live-countervalues/logic";
import { getFiatCurrencyByTicker, setSupportedCurrencies } from "../currencies";

setSupportedCurrencies(["ethereum", "ripple"]);
setEnv("MOCK", "1");
setEnv("MOCK_COUNTERVALUES", "1");
test("export CSV", async () => {
  const fiatCurrency = getFiatCurrencyByTicker("USD");
  const currencies = ["bitcoin", "ethereum", "ripple"].map(getCryptoCurrencyById);
  const state = await loadCountervalues(initialState, {
    trackingPairs: currencies.map(currency => ({
      from: currency,
      to: fiatCurrency,
      startDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
    })),
    autofillGaps: false,
  });
  const accounts = currencies.map(currency =>
    genAccount(`${currency.id}_export`, {
      currency,
    }),
  );
  expect(accountsOpToCSV(accounts, fiatCurrency, state)).toMatchSnapshot();
});
