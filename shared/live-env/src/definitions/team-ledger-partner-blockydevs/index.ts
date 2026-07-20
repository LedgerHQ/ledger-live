import { intParser, floatParser, stringParser } from "@ledgerhq/live-env";

const teamLedgerPartnerBlockydevs = {
  HEDERA_CLAIM_REWARDS_RECIPIENT_ACCOUNT_ID: {
    def: "0.0.163372",
    parser: stringParser,
    desc: "dead address that receives 1 tinybar from tx that is made to trigger rewards claiming",
  },
  HEDERA_STAKING_REWARD_ACCOUNT_ID: {
    def: "0.0.800",
    parser: stringParser,
    desc: "hedera staking reward account id",
  },
  HEDERA_STAKING_LEDGER_NODE_ID: {
    def: -1,
    parser: intParser,
    desc: "hedera staking ledger node id, used to determine the default validator",
  },
  HEDERA_TOKEN_ASSOCIATION_MIN_USD: {
    def: 0.05,
    parser: floatParser,
    desc: "Minimum USD value an account must hold to perform a token association",
  },
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
} as const;

export default teamLedgerPartnerBlockydevs;
