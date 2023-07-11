import { GroupedCurrency, MappedAsset } from "./type";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useEffect, useMemo, useState } from "react";
import { listTokens, isCurrencySupported, listSupportedCurrencies } from "../currencies";
import { getMappedAssets } from "./api";

function getMaxValueKey(obj) {
  return Object.keys(obj).reduce((a, b) => (obj[a] > obj[b] ? a : b));
}

const groupedCurrenciesByProvider = (data: MappedAsset[]) => {
  const groupedCurrencies = new Map<string, GroupedCurrency>();

  for (const currency of data) {
    let groupedCurrency = groupedCurrencies.get(currency.providerId);
    if (!groupedCurrency) {
      groupedCurrency = {
        names: {},
        providerId: currency.providerId,
        currenciesByNetwork: [],
        name: "",
        ticker: "",
      };
      groupedCurrencies.set(currency.providerId, groupedCurrency);
    }
    groupedCurrency.currenciesByNetwork.push(currency);
    const nameEntry = `${currency.name}/${currency.ticker}`;
    if (groupedCurrency.names[nameEntry]) {
      groupedCurrency.names[nameEntry]++;
    } else {
      groupedCurrency.names[nameEntry] = 1;
    }
  }

  groupedCurrencies.forEach(value => {
    if (value.currenciesByNetwork.length === 1) {
      value.ticker = value.currenciesByNetwork[0].ticker;
      value.name = value.currenciesByNetwork[0].name;
    } else {
      const maxKey = getMaxValueKey(value.names);
      const [name, ticker] = maxKey.split("/");
      value.name = name;
      value.ticker = ticker;
    }
  });

  const mapValues = Array.from(groupedCurrencies.entries());
  return mapValues;
};

const listSupportedTokens = () => listTokens().filter(t => isCurrencySupported(t.parentCurrency));

export const useMappedAssets = () => {
  const [displayableCoinsAndTokens, setCoinsAndTokens] = useState<MappedAsset[]>([]);
  const coinsAndTokensSupported = useMemo(
    () =>
      (listSupportedCurrencies() as (CryptoCurrency | TokenCurrency)[])
        .concat(listSupportedTokens())
        .map(elem => elem.id),
    [],
  );

  useEffect(() => {
    getMappedAssets().then(assets => {
      setCoinsAndTokens(assets.filter(asset => coinsAndTokensSupported.includes(asset.ledgerId)));
    });
  }, [coinsAndTokensSupported]);

  const searchByProviderId = (providerId: string) =>
    displayableCoinsAndTokens.filter(
      elem => elem.providerId.toLowerCase() === providerId.toLowerCase(),
    );
  const searchByNameOrTicker = (nameOrTicker: string) =>
    displayableCoinsAndTokens.filter(
      elem =>
        elem.name.toLowerCase().includes(nameOrTicker.toLowerCase()) ||
        elem.ticker.toLowerCase().includes(nameOrTicker.toLowerCase()),
    );

  return {
    displayableCoinsAndTokens,
    searchByProviderId,
    searchByNameOrTicker,
    groupedCurrenciesByProvider,
  };
};
