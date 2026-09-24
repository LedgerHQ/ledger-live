import { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import { clusterApiUrl } from "@solana/web3.js";
import { CurrencyLiveConfigDefinition } from "../../config";

const status: SolanaCoinConfig["status"] = {
  type: "active",
  features: [
    { id: "blockchain_txs", status: "active" },
    { id: "staking_txs", status: "active" },
  ],
};

const NFT_METADATA_SERVICE = "https://nft.api.live.ledger.com";
const SOLANA_VALIDATORS_SUMMARY_BASE_URL =
  "https://earn.api.live.ledger.com/figment/solana/validators_summary";
const TESTNET_VALIDATORS_APP_BASE_URL =
  "https://validators-solana.coin.ledger.com/api/v1/validators";

export const solanaConfig: CurrencyLiveConfigDefinition = {
  config_currency_solana: {
    type: "object",
    default: {
      status,
      token2022Enabled: false,
      legacyOCMSMaxVersion: "1.8.0",
      validatorsUrl: "https://validators-solana.coin.ledger.com/api/v1/validators/mainnet.json",
      infra: {
        API_SOLANA_PROXY: "https://solana.coin.ledger.com",
        SOLANA_VALIDATORS_APP_BASE_URL:
          "https://earn.api.live.ledger.com/v0/network/solana/validator-details",
        SOLANA_VALIDATORS_SUMMARY_BASE_URL,
        NFT_METADATA_SERVICE,
      },
    } satisfies SolanaCoinConfig,
  },
  config_currency_solana_testnet: {
    type: "object",
    default: {
      status,
      token2022Enabled: false,
      legacyOCMSMaxVersion: "1.8.0",
      infra: {
        API_SOLANA_PROXY: clusterApiUrl("testnet"),
        SOLANA_VALIDATORS_APP_BASE_URL: TESTNET_VALIDATORS_APP_BASE_URL,
        SOLANA_VALIDATORS_SUMMARY_BASE_URL,
        NFT_METADATA_SERVICE,
      },
    } satisfies SolanaCoinConfig,
  },
  config_currency_solana_devnet: {
    type: "object",
    default: {
      status,
      token2022Enabled: false,
      legacyOCMSMaxVersion: "1.8.0",
      infra: {
        API_SOLANA_PROXY: clusterApiUrl("devnet"),
        SOLANA_VALIDATORS_APP_BASE_URL: TESTNET_VALIDATORS_APP_BASE_URL,
        SOLANA_VALIDATORS_SUMMARY_BASE_URL,
        NFT_METADATA_SERVICE,
      },
    } satisfies SolanaCoinConfig,
  },
};
