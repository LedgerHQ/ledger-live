import { MappedAsset } from "./type";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useEffect, useMemo, useState } from "react";
import { listTokens, isCurrencySupported, listSupportedCurrencies } from "../currencies";
import { getMappedAssets } from "./api";

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

  return {
    displayableCoinsAndTokens,
  };
};
