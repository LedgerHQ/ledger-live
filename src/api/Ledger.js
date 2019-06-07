// @flow
import type { CryptoCurrency } from "../types";
import { getEnv } from "../env";
import { getCurrencyExplorer } from "../explorers";

export const blockchainBaseURL = (currency: CryptoCurrency): string => {
  const { id, version } = getCurrencyExplorer(currency);
  return `${getEnv("EXPLORER")}/blockchain/${version}/${id}`;
};
