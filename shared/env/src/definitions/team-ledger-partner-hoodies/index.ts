import { boolParser, stringParser } from "@ledgerhq/live-env";

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
  API_TEZOS_BLOCKCHAIN_EXPLORER_API_ENDPOINT: {
    def: "https://xtz-explorer.api.live.ledger.com/explorer",
    parser: stringParser,
    desc: "Ledger explorer API for tezos",
  },
  // gRPC-web is served from the host root — requests go to <url>/sui.rpc.v2.<Service>/<Method> —
  // so these carry no path, unlike their GraphQL counterparts.
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
