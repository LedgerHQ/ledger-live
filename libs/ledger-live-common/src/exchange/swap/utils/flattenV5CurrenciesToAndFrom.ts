import { ResponseData as ResponseDataFrom } from "../api/v5/fetchCurrencyFrom";
import { ResponseData as ResponseDataTo } from "../api/v5/fetchCurrencyTo";

export function flattenV5CurrenciesToAndFrom(data: ResponseDataFrom | ResponseDataTo) {
  const supportedCurrencies = data.currencyGroups.flatMap(group => group.supportedCurrencies);
  return Array.from(new Set(supportedCurrencies));
}
