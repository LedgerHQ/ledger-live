import { Currency } from "@domain/entity-currency";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import perFamily from "~/generated/MemoTagInput";
import { MEMO_TAG_COINS } from "../constants";

const getFamily = (coin: Currency): string => {
  switch (coin.type) {
    case "CryptoCurrency":
      return coin.family;
    case "TokenCurrency":
      return getFamily(getCryptoCurrencyById(coin.parentCurrencyId));
    default:
      return "";
  }
};

export function hasMemoTag(coin: Currency) {
  return getFamily(coin) in perFamily;
}

export function hasMemoDisclaimer(coin: Currency) {
  return MEMO_TAG_COINS.includes(getFamily(coin));
}
