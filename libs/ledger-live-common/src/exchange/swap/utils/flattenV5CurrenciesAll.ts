import { ResponseDataAll } from "../api/v5/fetchCurrencyAll";

export function flattenV5CurrenciesAll(response: ResponseDataAll): string[] {
  const flattenedAll = [...response.from, ...response.to].reduce<string[]>((acc, curr) => {
    return [...acc, ...curr.supportedCurrencies];
  }, []);

  return Array.from(new Set(flattenedAll));
}
