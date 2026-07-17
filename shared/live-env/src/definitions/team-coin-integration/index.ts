import {
  intParser,
  floatParser,
  boolParser,
  stringParser,
  stringArrayParser,
} from "@ledgerhq/live-env";

const teamCoinIntegration = {
  API_ALGORAND_BLOCKCHAIN_EXPLORER_API_ENDPOINT: {
    def: "https://algorand.coin.ledger.com",
    parser: stringParser,
    desc: "Node API endpoint for algorand",
  },
  BITCOIN_STUCK_TRANSACTION_TIMEOUT: {
    def: 20 * 60 * 1000,
    parser: intParser,
    desc: "Time after which an optimistic operation is considered stuck",
  },
  COSMOS_GAS_AMPLIFIER: {
    def: 1.3, // Same as Keplr
    parser: floatParser,
    desc: "Cosmos gas estimate multiplier",
  },
  API_POLKADOT_INDEXER: {
    parser: stringParser,
    def: "https://polkadot.coin.ledger.com",
    desc: "Explorer API for polkadot",
  },
  API_POLKADOT_SIDECAR: {
    parser: stringParser,
    def: "https://polkadot-mainnet-rest-api.coin.ledger.com/v1/rc",
    desc: "Polkadot rest-api base URL",
  },
  API_POLKADOT_SIDECAR_CREDENTIALS: {
    parser: stringParser,
    def: "",
    desc: "Polkadot Sidecar API credentials",
  },
  API_POLKADOT_NODE: {
    parser: stringParser,
    def: "https://polkadot-fullnodes.api.live.ledger.com",
    desc: "Polkadot Node",
  },
  POLKADOT_ELECTION_STATUS_THRESHOLD: {
    def: 25,
    parser: intParser,
    desc: "in blocks - number of blocks before Polkadot election effectively opens to consider it as open and disable all staking features",
  },
  MULTIVERSX_API_ENDPOINT: {
    parser: stringParser,
    def: "https://elrond.coin.ledger.com",
    desc: "MultiversX API url",
  },
  MULTIVERSX_DELEGATION_API_ENDPOINT: {
    parser: stringParser,
    def: "https://delegations-elrond.coin.ledger.com",
    desc: "MultiversX DELEGATION API url",
  },
  API_STELLAR_HORIZON: {
    parser: stringParser,
    def: "https://stellar.coin.ledger.com",
    desc: "Stellar Horizon API url",
  },
  API_STELLAR_HORIZON_FETCH_LIMIT: {
    parser: intParser,
    def: 100,
    desc: "Limit of operation that Horizon will fetch per page",
  },
  API_STELLAR_HORIZON_STATIC_FEE: {
    def: false,
    parser: boolParser,
    desc: "Static fee for Stellar account",
  },
  API_TRONGRID_PROXY: {
    parser: stringParser,
    def: "https://tron.coin.ledger.com",
    desc: "proxy url for trongrid API",
  },
  API_SOLANA_PROXY: {
    parser: stringParser,
    def: "https://solana.coin.ledger.com",
    desc: "proxy url for solana API",
  },
  SOLANA_VALIDATORS_APP_BASE_URL: {
    parser: stringParser,
    def: "https://earn.api.live.ledger.com/v0/network/solana/validator-details",
    desc: "base url for validators.app validator list",
  },
  SOLANA_VALIDATORS_SUMMARY_BASE_URL: {
    parser: stringParser,
    def: "https://earn.api.live.ledger.com/figment/solana/validators_summary",
    desc: "base url for validators.app validator summary",
  },
  SOLANA_TESTNET_VALIDATORS_APP_BASE_URL: {
    parser: stringParser,
    def: "https://validators-solana.coin.ledger.com/api/v1/validators",
    desc: "base url for testnet validators.app validator list",
  },
  SOLANA_TX_CONFIRMATION_TIMEOUT: {
    def: 100 * 1000,
    parser: intParser,
    desc: "solana transaction broadcast confirmation timeout",
  },
  ICON_NODE_ENDPOINT: {
    parser: stringParser,
    def: "https://icon.coin.ledger.com/api/v3",
    desc: "ICON RPC url",
  },
  ICON_DEBUG_ENDPOINT: {
    parser: stringParser,
    def: "https://icon.coin.ledger.com/api/v3d",
    desc: "ICON debug RPC url",
  },
  ICON_INDEXER_ENDPOINT: {
    parser: stringParser,
    def: "https://icon.coin.ledger.com/api/v1",
    desc: "ICON API url",
  },
  ICON_TESTNET_NODE_ENDPOINT: {
    parser: stringParser,
    def: "https://berlin.net.solidwallet.io/api/v3",
    desc: "ICON Berlin Testnet API url",
  },
  ICON_TESTNET_DEBUG_ENDPOINT: {
    parser: stringParser,
    def: "https://berlin.net.solidwallet.io/api/v3d",
    desc: "ICON Berlin Testnet debug",
  },
  ICON_TESTNET_INDEXER_ENDPOINT: {
    parser: stringParser,
    def: "https://tracker.berlin.icon.community/api/v1",
    desc: "ICON Berlin Testnet API url",
  },
  CRYPTO_ORG_INDEXER: {
    def: "https://cryptoorg-rpc-indexer.coin.ledger.com",
    parser: stringParser,
    desc: "location of the Cronos POS Chain (formerly Crypto.org) indexer API",
  },
  CRYPTO_ORG_TESTNET_INDEXER: {
    def: "https://cronos-pos.org/explorer/croeseid4",
    parser: stringParser,
    desc: "location of the Cronos POS Chain (formerly Crypto.org) indexer testnet API",
  },
  CRYPTO_ORG_RPC_URL: {
    def: "https://cryptoorg-rpc-node.coin.ledger.com",
    parser: stringParser,
    desc: "location of the Cronos POS Chain (formerly Crypto.org) chain node",
  },
  CRYPTO_ORG_TESTNET_RPC_URL: {
    def: "https://rpc-testnet-croeseid-4.crypto.org",
    parser: stringParser,
    desc: "location of the Cronos POS Chain (formerly Crypto.org) chain testnet node",
  },
  EIP1559_MINIMUM_FEES_GATE: {
    def: true,
    parser: boolParser,
    desc: "prevents the user from doing an EIP1559 transaction with fees too low",
  },
  EIP1559_PRIORITY_FEE_LOWER_GATE: {
    def: 0.85,
    parser: floatParser,
    desc: "minimum priority fee percents allowed compared to network conditions allowed when EIP1559_MINIMUM_FEES_GATE is activated",
  },
  EIP1559_BASE_FEE_MULTIPLIER: {
    def: 1.27,
    parser: floatParser,
    desc: "mutiplier for the base fee that is composing the maxFeePerGas property",
  },
  ETHEREUM_STUCK_TRANSACTION_TIMEOUT: {
    def: 5 * 60 * 1000,
    parser: intParser,
    desc: "Time after which an optimistic operation is considered stuck",
  },
  EVM_REPLACE_TX_LEGACY_GASPRICE_FACTOR: {
    def: 1.3,
    parser: floatParser,
    desc: "Replace transaction gasprice factor for legacy evm transaction. This value should be 1.1 minimum since this is the minimum increase required by most nodes",
  },
  EVM_REPLACE_TX_EIP1559_MAXFEE_FACTOR: {
    def: 1.3,
    parser: floatParser,
    desc: "Replace transaction max fee factor for EIP1559 evm transaction. This value should be 1.1 minimum since this is the minimum increase required by most nodes",
  },
  EVM_REPLACE_TX_EIP1559_MAXPRIORITYFEE_FACTOR: {
    def: 1.1,
    parser: floatParser,
    desc: "Replace transaction max priority fee factor for EIP1559 evm transaction. This value should be 1.1 minimum since this is the minimum increase required by most nodes",
  },
  EVM_FORCE_LEGACY_TRANSACTIONS: {
    def: false,
    parser: boolParser,
    desc: "Force transaction type 0 on EVM networks",
  },
  PLATFORM_DEBUG: {
    def: false,
    parser: boolParser,
    desc: "enable visibility of debug apps and tools in Platform Catalog",
  },
  PLATFORM_EXPERIMENTAL_APPS: {
    def: false,
    parser: boolParser,
    desc: "enable visibility of experimental apps and tools in Platform Catalog",
  },
  PLATFORM_MANIFEST_API_URL: {
    def: "https://live-app-catalog.ledger.com/api/v1/apps",
    parser: stringParser,
    desc: "url used to fetch platform app manifests",
  },
  PLATFORM_LOCAL_MANIFEST_JSON: {
    def: "",
    parser: stringParser,
    desc: 'json manifest for a local (test) platform app manifests. How to use: PLATFORM_LOCAL_MANIFEST_JSON="$(cat /path/to/file.json)"',
  },
  PLATFORM_GLOBAL_CATALOG_API_URL: {
    def: "https://cdn.live.ledger.com/platform/catalog/v1/data.json",
    parser: stringParser,
    desc: "url used to fetch platform app manifests",
  },
  PLATFORM_GLOBAL_CATALOG_STAGING_API_URL: {
    def: "https://cdn.live.ledger-stg.com/platform/catalog/v1/data.json",
    parser: stringParser,
    desc: "url used to fetch platform app manifests (staging)",
  },
  PLATFORM_RAMP_CATALOG_API_URL: {
    def: "https://cdn.live.ledger.com/platform/trade/v1/data.json",
    parser: stringParser,
    desc: "url used to fetch platform app manifests",
  },
  PLATFORM_RAMP_CATALOG_STAGING_API_URL: {
    def: "https://cdn.live.ledger-stg.com/platform/trade/v1/data.json",
    parser: stringParser,
    desc: "url used to fetch platform app manifests (staging)",
  },
  PLATFORM_API_URL: {
    def: "",
    parser: stringParser,
    desc: "url used to fetch platform catalog",
  },
  PLATFORM_API_VERSION: {
    def: 1,
    parser: intParser,
    desc: "version used for the platform api",
  },
  WALLETCONNECT: {
    def: false,
    parser: boolParser,
    desc: "is walletconnect enabled",
  },
  WALLETCONNECT_PROJECT_ID: {
    def: "053f3301d5f72cf59dbab8ebeab71f23",
    parser: stringParser,
    desc: "WalletConnect Project ID",
  },
  NFT_CURRENCIES: {
    def: ["avalanche_c_chain", "bsc", "ethereum", "polygon", "solana"],
    parser: stringArrayParser,
    desc: "set the currencies where NFT is active",
  },
  NFT_METADATA_SERVICE: {
    def: "https://nft.api.live.ledger.com",
    parser: stringParser,
    desc: "service uri used to get the metadata of an nft",
  },
  ADDRESS_POISONING_FAMILIES: {
    def: "evm,tron,stellar,hedera,algorand,cardano,cosmos,solana,xrp",
    parser: stringParser,
    desc: "List of families impacted by the address poisoning attack",
  },
  FILTER_ZERO_AMOUNT_ERC20_EVENTS: {
    def: true,
    parser: boolParser,
    desc: "Remove filter of address poisoning",
  },
  SANCTIONED_ADDRESSES_URL: {
    def: "https://compliance.ledger.com/all_sanctioned_addresses_without_ticker.json",
    parser: stringParser,
    desc: "List of sanctioned addresses",
  },
  EXPERIMENTAL_EXPLORERS: {
    def: false,
    parser: boolParser,
    desc: "enable experimental explorer APIs",
  },
  EXPERIMENTAL_SEND_MAX: {
    def: false,
    parser: boolParser,
    desc: "force enabling SEND MAX even if not yet stable",
  },
  MOCK_REMOTE_LIVE_MANIFEST: {
    def: "",
    parser: stringParser,
    desc: "mock remote live app manifest",
  },
  EXPLORER: {
    def: "https://explorers.api.live.ledger.com",
    parser: stringParser,
    desc: "Ledger generic explorer API",
  },
  EXPLORER_REGTEST: {
    def: "http://localhost:9876",
    parser: stringParser,
    desc: "Ledger regtest Bitcoin explorer API",
  },
  LEDGER_REST_API_BASE: {
    def: "https://explorers.api.live.ledger.com",
    parser: stringParser,
    desc: "DEPRECATED",
  },
  CAL_REF: {
    def: "",
    parser: stringParser,
    desc: "(dev feature) allows to target a different reference of the CAL for testing purposes",
  },
  DYNAMIC_CAL_BASE_URL: {
    def: "https://cdn.live.ledger.com/cryptoassets",
    parser: stringParser,
    desc: "bucket S3 of the dynamic cryptoassets list",
  },
  CAL_SERVICE_URL: {
    def: "https://global.api.prd.ledger.com/cal",
    parser: stringParser,
    desc: "Cryptoassets list service url",
  },
  CAL_SERVICE_URL_STAGING: {
    def: "https://global.api.stg.ledger-test.com/cal",
    parser: stringParser,
    desc: "Cryptoassets list service url (staging)",
  },
  LEDGER_CLIENT_VERSION: {
    def: "",
    parser: stringParser,
    desc: "the 'X-Ledger-Client-Version' HTTP header to use for queries to Ledger APIs",
  },
  BOT_TIMEOUT_SCAN_ACCOUNTS: {
    def: 10 * 60 * 1000,
    parser: intParser,
    desc: "bot's default timeout for scanAccounts",
  },
  BOT_SPEC_DEFAULT_TIMEOUT: {
    def: 30 * 60 * 1000,
    parser: intParser,
    desc: "define the default value of spec.skipMutationsTimeout (if not overriden by spec)",
  },
  BOT_MAX_CONCURRENT: {
    def: 10,
    parser: intParser,
    desc: "maximum limit to run bot spec in parallel",
  },
  SYNC_ALL_INTERVAL: {
    def: 8 * 60 * 1000,
    parser: intParser,
    desc: "delay between successive sync",
  },
  SYNC_BOOT_DELAY: {
    def: 2 * 1000,
    parser: intParser,
    desc: "delay before the sync starts",
  },
  SYNC_PENDING_INTERVAL: {
    def: 10 * 1000,
    parser: intParser,
    desc: "delay between sync when an operation is still pending",
  },
  SYNC_OUTDATED_CONSIDERED_DELAY: {
    def: 10 * 60 * 1000,
    parser: intParser,
    desc: "delay until Live consider a sync outdated",
  },
  SYNC_MAX_CONCURRENT: {
    def: 4,
    parser: intParser,
    desc: "maximum limit to synchronize accounts concurrently to limit overload",
  },
  OPERATION_ADDRESSES_LIMIT: {
    def: 100,
    parser: intParser,
    desc: "limit the number of addresses in from/to of operations",
  },
  OPERATION_OPTIMISTIC_RETENTION: {
    def: 30 * 60 * 1000,
    parser: intParser,
    desc: "timeout to keep an optimistic operation that was broadcasted but not yet visible from the coin implementation or the API",
  },
  OPERATION_PAGE_SIZE_INITIAL: {
    def: 100,
    parser: intParser,
    desc: "defines the initial default operation length page to use",
  },
  DISABLE_SYNC_TOKEN: {
    def: true,
    parser: boolParser,
    desc: "disable a problematic mechanism of our API",
  },
  DISABLE_TRANSACTION_BROADCAST: {
    def: false,
    parser: boolParser,
    desc: "disable broadcast of transactions",
  },
  GET_CALLS_RETRY: {
    def: 2,
    parser: intParser,
    desc: "how many times to retry a GET http call",
  },
  GET_CALLS_TIMEOUT: {
    def: 60 * 1000,
    parser: intParser,
    desc: "how much time to timeout a GET http call",
  },
  SCAN_FOR_INVALID_PATHS: {
    def: false,
    parser: boolParser,
    desc: "enable searching accounts in exotic derivation paths",
  },
  KEYCHAIN_OBSERVABLE_RANGE: {
    def: 0,
    parser: intParser,
    desc: "overrides the gap limit specified by BIP44 (default to 20)",
  },
  DEFAULT_TRANSACTION_POLLING_INTERVAL: {
    def: 30 * 1000,
    parser: intParser,
    desc: "Default interval to poll for transaction confirmation in speedup/cancel evm flow (in ms)",
  },
  DEBUG_HTTP_RESPONSE: {
    def: false,
    parser: boolParser,
    desc: "includes HTTP response body in logs",
  },
  ENABLE_NETWORK_LOGS: {
    def: false,
    parser: boolParser,
    desc: "Enable network request and responses logs. Errors are always logged",
  },
  DEBUG_UTXO_DISPLAY: {
    def: 4,
    parser: intParser,
    desc: "define maximum number of utxos to display in CLI",
  },
} as const;

export default teamCoinIntegration;
