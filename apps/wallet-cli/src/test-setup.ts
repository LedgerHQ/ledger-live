import {
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  getCryptoCurrencyById,
  hasCryptoCurrencyId,
  listCryptoCurrencies,
} from "@domain/entity-currency-crypto";
import { setCurrenciesResolver } from "@ledgerhq/ledger-wallet-framework/currencies";

setCurrenciesResolver({
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
});
