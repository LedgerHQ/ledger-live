import type { CoinConfig } from "@ledgerhq/coin-framework/config";
import type { HederaCoinConfig } from "../../config";

export const mockCoinConfig: CoinConfig<HederaCoinConfig> = () => ({
  status: {
    type: "active",
  },
  networkType: "mainnet",
  apiUrls: {
    hgraph: "https://mainnet.hgraph.hashio.io/graphql",
    mirrorNode: "https://mainnet.mirrornode.hedera.com/api/v1",
  },
});
