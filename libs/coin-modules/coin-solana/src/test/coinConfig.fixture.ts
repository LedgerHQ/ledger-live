import type { SolanaCoinConfig } from "../config";

export const INFRA_FIXTURE: SolanaCoinConfig["infra"] = {
  API_SOLANA_PROXY: "https://rpc.example",
  SOLANA_VALIDATORS_APP_BASE_URL: "https://validators.example",
  SOLANA_VALIDATORS_SUMMARY_BASE_URL: "https://validators-summary.example",
  NFT_METADATA_SERVICE: "https://nft.example",
};

/** The live mainnet endpoints, for integration tests that hit the network. */
export const MAINNET_INFRA: SolanaCoinConfig["infra"] = {
  API_SOLANA_PROXY: "https://solana.coin.ledger.com",
  SOLANA_VALIDATORS_APP_BASE_URL:
    "https://earn.api.live.ledger.com/v0/network/solana/validator-details",
  SOLANA_VALIDATORS_SUMMARY_BASE_URL:
    "https://earn.api.live.ledger.com/figment/solana/validators_summary",
  NFT_METADATA_SERVICE: "https://nft.api.live.ledger.com",
};

export const coinConfigFixture = (overrides: Partial<SolanaCoinConfig> = {}): SolanaCoinConfig => ({
  status: { type: "active" },
  token2022Enabled: false,
  legacyOCMSMaxVersion: "1.0.0",
  infra: INFRA_FIXTURE,
  ...overrides,
});
