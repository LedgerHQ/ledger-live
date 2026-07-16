import { setCurrenciesResolver } from "@ledgerhq/ledger-wallet-framework/currencies";
import { getCryptoCurrencyById } from "./src/tests/currencies";

const LOCAL_CURRENCIES = ["bitcoin", "ethereum"].map(id => getCryptoCurrencyById(id));

setCurrenciesResolver({
  getCryptoCurrencyById,
  findCryptoCurrencyById: id => {
    try {
      return getCryptoCurrencyById(id);
    } catch {
      return undefined;
    }
  },
  findCryptoCurrencyByScheme: () => undefined,
  listCryptoCurrencies: () => LOCAL_CURRENCIES,
  hasCryptoCurrencyId: id => {
    try {
      getCryptoCurrencyById(id);
      return true;
    } catch {
      return false;
    }
  },
});
