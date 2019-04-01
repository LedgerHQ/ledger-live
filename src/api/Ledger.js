// @flow
import type { CryptoCurrency } from "../types";
import { getEnv } from "../env";
import { getCurrencyExplorer } from "../explorers";

const ledgerExplorersByVersionEnv = {
  v2: "EXPLORER_V2",
  v3: "EXPLORER_V3"
};

export const blockchainBaseURL = (currency: CryptoCurrency): ?string => {
  const { id, version } = getCurrencyExplorer(currency);
  return id
    ? (getEnv(ledgerExplorersByVersionEnv[version]) || "").replace(
        "$ledgerExplorerId",
        id
      )
    : null;
};
