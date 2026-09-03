import { boolParser, stringParser } from "@ledgerhq/live-env";

const teamBlockchainSupport = {
  APTOS_API_ENDPOINT: {
    def: "https://apt.coin.ledger.com/node",
    parser: stringParser,
    desc: "API endpoint for Aptos",
  },
  APTOS_TESTNET_API_ENDPOINT: {
    def: "https://api.testnet.aptoslabs.com/v1",
    parser: stringParser,
    desc: "API endpoint for Aptos testnet",
  },
  APTOS_INDEXER_ENDPOINT: {
    def: "https://apt.coin.ledger.com/indexer",
    parser: stringParser,
    desc: "Indexer endpoint for Aptos",
  },
  APTOS_TESTNET_INDEXER_ENDPOINT: {
    def: "https://api.testnet.aptoslabs.com/v1/graphql",
    parser: stringParser,
    desc: "Indexer endpoint for Aptos testnet",
  },
  APTOS_ENABLE_TOKENS: {
    def: false,
    parser: boolParser,
    desc: "Enable tokens on Aptos",
  },
  CASPER_GENERIC_BRIDGE: {
    def: true,
    parser: boolParser,
    desc: "Route Casper through the generic coin framework bridge. Set false to fall back to the legacy bridge.",
  },
  APTOS_ENABLE_STAKING: {
    def: false,
    parser: boolParser,
    desc: "Enable staking for Aptos",
  },
  API_FILECOIN_ENDPOINT: {
    parser: stringParser,
    def: "https://filecoin.coin.ledger.com",
    desc: "Filecoin API url",
  },
  API_STACKS_ENDPOINT: {
    parser: stringParser,
    def: "https://stacks.coin.ledger.com",
    desc: "Stacks API url",
  },
  API_STACKS_NETWORK: {
    parser: stringParser,
    def: "mainnet",
    desc: "Stacks network for legacy-bridge address derivation (mainnet | testnet)",
  },
  API_STACKS_SKIP_FEE_ESTIMATE: {
    parser: boolParser,
    def: false,
    desc: "Coin-tester only: skip the network fee estimate and keep the transaction's own pre-set fee (devnet has no historical fee data)",
  },
  API_KASPA_ENDPOINT: {
    parser: stringParser,
    def: "https://kaspa.coin.ledger.com",
    desc: "Kaspa API url",
  },
  API_VECHAIN_THOREST: {
    def: "https://vechain.coin.ledger.com",
    parser: stringParser,
    desc: "Thorest API for VeChain",
  },
};

export default teamBlockchainSupport;
