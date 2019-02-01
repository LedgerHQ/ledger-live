// @flow
import type { Currency } from "../types";

const ledgerExplorersByVersion = {
  v2: "https://explorers.api.live.ledger.com/blockchain/v2/$ledgerExplorerId",
  v3: "http://$ledgerExplorerId.explorers.prod.aws.ledger.fr/blockchain/v3"
};

export const blockchainBaseURL = ({
  ledgerExplorerId,
  ledgerExplorerVersion
}: Currency): ?string =>
  ledgerExplorerId && ledgerExplorerVersion
    ? (ledgerExplorersByVersion[ledgerExplorerVersion] || "").replace(
        "$ledgerExplorerId",
        ledgerExplorerId
      )
    : null;
