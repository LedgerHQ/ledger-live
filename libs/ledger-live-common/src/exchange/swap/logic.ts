import uniq from "lodash/uniq";
import type { AvailableProviderV3 } from "./types";

export const getSwapSelectableCurrencies = (rawProviderData: Array<AvailableProviderV3>) => {
  const ids: string[] = [];
  rawProviderData.forEach(provider => {
    const { pairs } = provider;
    pairs.forEach(({ from, to }) => ids.push(from, to));
  });
  return uniq<string>(ids);
};
