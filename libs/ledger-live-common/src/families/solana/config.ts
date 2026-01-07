import { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import { CurrencyLiveConfigDefinition } from "../../config";

export const solanaConfig: CurrencyLiveConfigDefinition = {
  config_currency_solana: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", status: "active" },
          { id: "staking_txs", status: "active" },
        ],
      },
      token2022Enabled: false,
      legacyOCMSMaxVersion: "1.8.0",
    } satisfies SolanaCoinConfig,
  },
};
