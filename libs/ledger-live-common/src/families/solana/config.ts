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
      name: "Solana",
      unit: { name: "SOL", code: "SOL", magnitude: 9 },
      token2022Enabled: true,
      legacyOCMSMaxVersion: "1.8.0",
      rpcUrls: { solana: "https://solana.coin.ledger.com" },
      validatorsUrl: "https://earn.api.live.ledger.com/v0/network/solana/validator-details",
      staking: {
        validatorsSummaryUrl: "https://earn.api.live.ledger.com/figment/solana/validators_summary",
      },
    } satisfies SolanaCoinConfig,
  },

  config_currency_solana_devnet: {
    type: "object",
    default: {
      status: { type: "active" },
      name: "Solana devnet",
      unit: { name: "SOL", code: "SOL", magnitude: 9 },
      token2022Enabled: true,
      legacyOCMSMaxVersion: "1.8.0",
      rpcUrls: { solana_devnet: "https://api.devnet.solana.com" },
    } satisfies SolanaCoinConfig,
  },

  config_currency_solana_testnet: {
    type: "object",
    default: {
      status: { type: "active" },
      name: "Solana testnet",
      unit: { name: "SOL", code: "SOL", magnitude: 9 },
      token2022Enabled: true,
      legacyOCMSMaxVersion: "1.8.0",
      rpcUrls: { solana_testnet: "https://api.testnet.solana.com" },
      validatorsUrl:
        "https://validators-solana.coin.ledger.com/api/v1/validators/testnet.json?order=score&limit=1000",
    } satisfies SolanaCoinConfig,
  },
};
