import { intParser, boolParser, stringParser } from "@ledgerhq/live-env";

const teamLedgerPartnerHoodies = {
  API_CELO_INDEXER: {
    def: "https://celo.coin.ledger.com/indexer/",
    parser: stringParser,
    desc: "Explorer API for celo",
  },
  API_CELO_NODE: {
    def: "https://celo.coin.ledger.com/archive/",
    parser: stringParser,
    desc: "Node endpoint for celo",
  },
  ENABLE_CELO_TOKENS: {
    def: true,
    parser: boolParser,
    desc: "Enable token send and receive for Celo",
  },
  API_TEZOS_BAKER: {
    parser: stringParser,
    def: "https://tezos-bakers.api.live.ledger.com",
    desc: "bakers API for tezos",
  },
  API_TEZOS_BLOCKCHAIN_EXPLORER_API_ENDPOINT: {
    def: "https://xtz-explorer.api.live.ledger.com/explorer",
    parser: stringParser,
    desc: "Ledger explorer API for tezos",
  },
  API_TEZOS_TZKT_API: {
    def: "https://xtz-tzkt-explorer.api.live.ledger.com",
    parser: stringParser,
    desc: "tzkt.io explorer",
  },
  API_TEZOS_NODE: {
    def: "https://xtz-node.api.live.ledger.com",
    parser: stringParser,
    desc: "node API for tezos (for broadcast only)",
  },
  TEZOS_MAX_TX_QUERIES: {
    def: 100,
    parser: intParser,
    desc: "safe max on maximum number of queries to synchronize a tezos account",
  },
  API_SUI_TESTNET_NODE_PROXY: {
    parser: stringParser,
    def: "https://fullnode.testnet.sui.io:443",
    desc: "public fullnode url for sui testnet node",
  },
  API_SUI_NODE_PROXY: {
    parser: stringParser,
    def: "https://sui.coin.ledger.com",
    desc: "reverse proxy url for sui node",
  },
  API_SUI_GRAPHQL_PROXY: {
    parser: stringParser,
    def: "https://sui.coin.ledger.com/graphql",
    desc: "reverse proxy url for sui graphql",
  },
  API_SUI_TESTNET_GRAPHQL_PROXY: {
    parser: stringParser,
    def: "https://graphql.testnet.sui.io/graphql",
    desc: "GraphQL endpoint url for sui testnet",
  },
  SUI_ENABLE_TOKENS: {
    parser: boolParser,
    def: true,
    desc: "Enable tokens on Sui",
  },
  CANTON_API_KEY: {
    def: "",
    parser: stringParser,
    desc: "API key for Canton network gateway authentication",
  },
  CANTON_NODE_ID_OVERRIDE: {
    def: "",
    parser: stringParser,
    desc: "(dev feature) Switch Canton gateway nodeId for testing different presets.",
  },
  CARDANO_API_ENDPOINT: {
    def: "https://cardano.coin.ledger.com/api",
    parser: stringParser,
    desc: "Cardano API url",
  },
  CARDANO_TESTNET_API_ENDPOINT: {
    def: "https://ledger-preprod.cardanoscan.io/api",
    parser: stringParser,
    desc: "Cardano API url",
  },
  CARDANO_EPOCH_PARAMS_ENDPOINT: {
    def: "https://ada.api.live.ledger.com/api/rest/params",
    parser: stringParser,
    desc: "Cardano current-epoch protocol params url (validator APY)",
  },
  CARDANO_TESTNET_EPOCH_PARAMS_ENDPOINT: {
    def: "https://ada-testnet.api.live.ledger-test.com/api/rest/params",
    parser: stringParser,
    desc: "Cardano testnet current-epoch protocol params url (validator APY)",
  },
  LEGACY_KT_SUPPORT_TO_YOUR_OWN_RISK: {
    def: false,
    parser: boolParser,
    desc: "enable sending to KT accounts. Not tested.",
  },
};

export default teamLedgerPartnerHoodies;
