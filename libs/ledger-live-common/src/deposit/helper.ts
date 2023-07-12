import { CryptoCurrency, Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  currenciesByMarketcap,
  findCryptoCurrencyById,
  findTokenById,
  useCurrenciesByMarketcap,
} from "../currencies";
import { MappedAsset, GroupedCurrency } from "./type";

function getMaxValueIndex(obj) {
  return Object.keys(obj).reduce((a, b) => (obj[a] > obj[b] ? a : b));
}

const groupedCurrenciesByProvider = async (data: MappedAsset[]) => {
  const groupedCurrencies = new Map<string, GroupedCurrency>();

  for (const currency of data) {
    let groupedCurrency = groupedCurrencies.get(currency.providerId);
    if (!groupedCurrency) {
      groupedCurrency = {
        providerId: currency.providerId,
        currenciesByNetwork: [],
      };
      groupedCurrencies.set(currency.providerId, groupedCurrency);
    }
    groupedCurrency.currenciesByNetwork.push({
      ...currency,
      ledgerCurrency: (findCryptoCurrencyById(currency.ledgerId) ||
        findTokenById(currency.ledgerId)) as CryptoCurrency | TokenCurrency,
    });
  }

  const mapValues = Array.from(groupedCurrencies.entries()).map(async ([_, value]) => {
    const currencies = value.currenciesByNetwork.map(
      e => e.ledgerCurrency as CryptoCurrency | TokenCurrency,
    );
    const res = await currenciesByMarketcap(currencies);
    return {
      ...value,
      currenciesByNetwork: res,
    };
  });

  return Promise.all(mapValues);
};

const searchByProviderId = (list: MappedAsset[], providerId: string) =>
  list.filter(elem => elem.providerId.toLowerCase() === providerId.toLowerCase());

const searchByNameOrTicker = (list: MappedAsset[], nameOrTicker: string) =>
  list.filter(
    elem =>
      elem.name.toLowerCase().includes(nameOrTicker.toLowerCase()) ||
      elem.ticker.toLowerCase().includes(nameOrTicker.toLowerCase()),
  );

export { searchByProviderId, searchByNameOrTicker, groupedCurrenciesByProvider };
