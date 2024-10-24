import { Currency } from "@ledgerhq/types-cryptoassets";
import perFamily from "~/generated/MemoTagInput";

export function hasMemoTag(coin: Currency): boolean {
  switch (coin.type) {
    case "CryptoCurrency":
      return coin.family in perFamily;
    case "TokenCurrency":
      return hasMemoTag(coin.parentCurrency);
    default:
      return false;
  }
}
