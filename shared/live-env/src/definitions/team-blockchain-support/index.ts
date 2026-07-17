import { boolParser, stringParser } from "@ledgerhq/live-env";

const teamBlockchainSupport = {
  APTOS_API_ENDPOINT: {
    def: "https://apt.coin.ledger.com/node/v1",
    parser: stringParser,
    desc: "API enpoint for Aptos",
  },
  APTOS_TESTNET_API_ENDPOINT: {
    def: "https://api.testnet.aptoslabs.com/v1",
    parser: stringParser,
    desc: "API endpoint for Aptos testnet",
  },
  APTOS_INDEXER_ENDPOINT: {
    def: "https://apt.coin.ledger.com/node/v1/graphql",
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
} as const;

export default teamBlockchainSupport;
