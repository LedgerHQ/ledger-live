// @flow
import type { CryptoCurrency } from "../types";
import { getEnv } from "../env";

const ledgerExplorersByVersionEnv = {
  v2: "EXPLORER_V2",
  v3: "EXPLORER_V3"
};

export const blockchainBaseURL = ({
  ledgerExplorerId,
  ledgerExplorerVersion
}: CryptoCurrency): ?string =>
  ledgerExplorerId && ledgerExplorerVersion
    ? (
        getEnv(ledgerExplorersByVersionEnv[ledgerExplorerVersion]) || ""
      ).replace("$ledgerExplorerId", ledgerExplorerId)
    : null;
