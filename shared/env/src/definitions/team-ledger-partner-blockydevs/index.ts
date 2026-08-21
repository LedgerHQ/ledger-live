import { stringParser } from "@ledgerhq/live-env";

const teamLedgerPartnerBlockydevs = {
  API_HEDERA_MIRROR: {
    def: "https://hedera.coin.ledger.com",
    parser: stringParser,
    desc: "mirror node API for Hedera",
  },
  API_HEDERA_MIRROR_TESTNET: {
    def: "https://hedera-testnet.coin.ledger.com",
    parser: stringParser,
    desc: "testnet mirror node API for Hedera",
  },
  API_HEDERA_HGRAPH: {
    def: "https://hedera-indexer-mainnet.coin.ledger.com/v1/graphql",
    parser: stringParser,
    desc: "Hgraph API for Hedera (ERC20 data source)",
  },
  API_HEDERA_HGRAPH_TESTNET: {
    def: "https://hedera-indexer-testnet.coin.ledger.com/v1/graphql",
    parser: stringParser,
    desc: "testnet hgraph API for Hedera",
  },
  ALEO_NODE_ENDPOINT: {
    def: "https://aleo.coin.ledger.com",
    parser: stringParser,
    desc: "Aleo mainnet node URL",
  },
  ALEO_MAINNET_SDK_ENDPOINT: {
    def: "https://aleo-backend.api.live.ledger.com/network/mainnet",
    parser: stringParser,
    desc: "Aleo mainnet SDK URL",
  },
  ALEO_TESTNET_SDK_ENDPOINT: {
    def: "https://aleo-backend.api.live.ledger.com/network/testnet",
    parser: stringParser,
    desc: "Aleo testnet SDK URL",
  },
};

export default teamLedgerPartnerBlockydevs;
