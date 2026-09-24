import { intParser, boolParser, stringParser } from "@ledgerhq/live-env";

const teamLedgerPartnerHoodies = {
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
  // gRPC-web is served from the host root — requests go to <url>/sui.rpc.v2.<Service>/<Method> —
  // so these carry no path, unlike their GraphQL counterparts.
  API_SUI_GRPC_PROXY: {
    parser: stringParser,
    def: "https://sui.coin.ledger.com",
    desc: "reverse proxy url for sui grpc-web",
  },
  API_SUI_TESTNET_GRPC_PROXY: {
    parser: stringParser,
    def: "https://fullnode.testnet.sui.io:443",
    desc: "grpc-web endpoint url for sui testnet",
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
  LEGACY_KT_SUPPORT_TO_YOUR_OWN_RISK: {
    def: false,
    parser: boolParser,
    desc: "enable sending to KT accounts. Not tested.",
  },
};

export default teamLedgerPartnerHoodies;
