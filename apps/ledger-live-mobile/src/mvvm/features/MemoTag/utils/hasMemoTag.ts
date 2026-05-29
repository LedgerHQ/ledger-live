import { Currency } from "@ledgerhq/types-cryptoassets";
import { memoTagInputFamilies } from "~/families/loaders";
import { MEMO_TAG_COINS } from "../constants";

const getFamily = (coin: Currency): string => {
  switch (coin.type) {
    case "CryptoCurrency":
      return coin.family;
    case "TokenCurrency":
      return getFamily(coin.parentCurrency);
    default:
      return "";
  }
};

export function hasMemoTag(coin: Currency) {
  return memoTagInputFamilies.has(getFamily(coin));
}

export function hasMemoDisclaimer(coin: Currency) {
  return MEMO_TAG_COINS.includes(getFamily(coin));
}
