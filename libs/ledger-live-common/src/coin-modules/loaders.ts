import type { CoinModuleLoader, FamilySetup, ValidateAddressFn } from "./types";

export const coinModuleLoaders: CoinModuleLoader[] = [
  {
    family: "aleo",
    supportedCoins: ["aleo", "aleo_testnet"],
    loadSetup: () => import("../families/aleo/setup"),
    loadTransaction: () => import("@ledgerhq/coin-aleo/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-aleo/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "algorand",
    supportedCoins: ["algorand"],
    loadSetup: () => import("../families/algorand/setup"),
    loadTransaction: () => import("@ledgerhq/coin-algorand/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-algorand/deviceTransactionConfig").then(m => m.default),
    loadMockBridge: () => import("../families/algorand/bridge/mock").then(m => m.default),
    loadMockAccount: () => import("@ledgerhq/coin-algorand/mock").then(m => m.default),
  },
  {
    family: "aptos",
    supportedCoins: ["aptos", "aptos_testnet"],
    loadSetup: () => import("../families/aptos/setup"),
    loadTransaction: () => import("@ledgerhq/coin-aptos/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-aptos/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "bitcoin",
    supportedCoins: [
      "bitcoin",
      "litecoin",
      "bitcoin_cash",
      "dogecoin",
      "dash",
      "zcash",
      "decred",
      "digibyte",
      "qtum",
      "bitcoin_gold",
      "komodo",
      "zencash",
      "bitcoin_testnet",
      "bitcoin_regtest",
    ],
    loadSetup: () => import("../families/bitcoin/setup"),
    loadTransaction: () => import("@ledgerhq/coin-bitcoin/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-bitcoin/deviceTransactionConfig").then(m => m.default),
    loadWalletApiAdapter: () => import("../families/bitcoin/walletApiAdapter").then(m => m.default),
    loadPlatformAdapter: () => import("../families/bitcoin/platformAdapter").then(m => m.default),
    loadAccount: () => import("@ledgerhq/coin-bitcoin/account").then(m => m.default),
    loadMockBridge: () => import("../families/bitcoin/bridge/mock").then(m => m.default),
    loadBridgeExtensions: () => import("../families/bitcoin/bridgeExtensions").then(m => m.default),
  },
  {
    family: "canton",
    supportedCoins: ["canton_network", "canton_network_devnet", "canton_network_testnet"],
    loadSetup: () => import("../families/canton/setup"),
    loadTransaction: () => import("@ledgerhq/coin-canton/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-canton/deviceTransactionConfig").then(m => m.default),
    loadMockBridge: () => import("../families/canton/bridge/mock").then(m => m.default),
    loadBridgeExtensions: () => import("../families/canton/bridgeExtensions").then(m => m.default),
  },
  {
    family: "cardano",
    supportedCoins: ["cardano"],
    loadSetup: () => import("../families/cardano/setup"),
    loadTransaction: () => import("@ledgerhq/coin-cardano/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-cardano/deviceTransactionConfig").then(m => m.default),
    loadAccount: () => import("@ledgerhq/coin-cardano/account").then(m => m.default),
    loadMockBridge: () => import("../families/cardano/bridge/mock").then(m => m.default),
  },
  {
    family: "casper",
    supportedCoins: ["casper"],
    loadSetup: () => import("../families/casper/setup"),
    loadTransaction: () => import("@ledgerhq/coin-casper/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-casper/deviceTransactionConfig").then(m => m.default),
    loadMockBridge: () => import("../families/casper/bridge/mock").then(m => m.default),
  },
  {
    family: "celo",
    supportedCoins: ["celo"],
    loadSetup: () => import("../families/celo/setup"),
    loadTransaction: () => import("@ledgerhq/coin-celo/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-celo/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "concordium",
    supportedCoins: ["concordium", "concordium_testnet"],
    loadSetup: () => import("../families/concordium/setup"),
    loadTransaction: () => import("@ledgerhq/coin-concordium/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-concordium/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "cosmos",
    supportedCoins: [
      "axelar",
      "stargaze",
      "secret_network",
      "umee",
      "desmos",
      "dydx",
      "quicksilver",
      "persistence",
      "cosmos",
      "crypto_org",
      "crypto_org_croeseid",
      "osmosis",
      "coreum",
      "injective",
      "mantra",
      "xion",
      "zenrock",
      "babylon",
    ],
    loadSetup: () => import("../families/cosmos/setup"),
    loadTransaction: () => import("@ledgerhq/coin-cosmos/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-cosmos/deviceTransactionConfig").then(m => m.default),
    loadWalletApiAdapter: () => import("../families/cosmos/walletApiAdapter").then(m => m.default),
    loadMockBridge: () => import("../families/cosmos/bridge/mock").then(m => m.default),
    loadMockAccount: () => import("@ledgerhq/coin-cosmos/mock").then(m => m.default),
    loadBridgeExtensions: () => import("../families/cosmos/bridgeExtensions").then(m => m.default),
  },
  {
    family: "evm",
    supportedCoins: [
      "avalanche_c_chain",
      "avalanche_c_chain_fuji",
      "ethereum",
      "bsc",
      "polygon",
      "polygon_amoy",
      "ethereum_classic",
      "ethereum_sepolia",
      "ethereum_hoodi",
      "fantom",
      "core",
      "cronos",
      "moonbeam",
      "songbird",
      "flare",
      "adi",
      "optimism",
      "optimism_sepolia",
      "arbitrum",
      "arbitrum_sepolia",
      "rsk",
      "bittorrent",
      "energy_web",
      "astar",
      "metis",
      "mantle",
      "mantle_sepolia",
      "boba",
      "moonriver",
      "velas_evm",
      "syscoin",
      "bitlayer",
      "klaytn",
      "klaytn_baobab",
      "polygon_zk_evm",
      "polygon_zk_evm_testnet",
      "base",
      "base_sepolia",
      "telos_evm",
      "sei_evm",
      "berachain",
      "hyperevm",
      "arc",
      "arc_testnet",
      "neon_evm",
      "lukso",
      "linea",
      "linea_sepolia",
      "blast",
      "blast_sepolia",
      "scroll",
      "scroll_sepolia",
      "shape",
      "story",
      "etherlink",
      "zksync",
      "zksync_sepolia",
      "sonic",
      "monad",
      "monad_testnet",
      "somnia",
      "zero_gravity",
      "unichain",
      "unichain_sepolia",
    ],
    loadSetup: () => import("../families/evm/setup"),
    loadTransaction: () => import("@ledgerhq/coin-evm/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-evm/deviceTransactionConfig").then(m => m.default),
    loadWalletApiAdapter: () => import("../families/evm/walletApiAdapter").then(m => m.default),
    loadPlatformAdapter: () => import("../families/evm/platformAdapter").then(m => m.default),
    loadMockBridge: () => import("../families/evm/bridge/mock").then(m => m.default),
    loadValidateAddress: () =>
      import("@ledgerhq/coin-evm/logic/validateAddress").then(
        ({ validateAddress }): ValidateAddressFn => validateAddress,
      ),
    loadSigner: () =>
      import("../bridge/generic-coin-framework/families/evm/signer").then(m => m.default),
    loadBridgeExtensions: () => import("../families/evm/bridgeExtensions").then(m => m.default),
  },
  {
    family: "filecoin",
    supportedCoins: ["filecoin"],
    loadSetup: () => import("../families/filecoin/setup"),
    loadTransaction: () => import("@ledgerhq/coin-filecoin/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-filecoin/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "hedera",
    supportedCoins: ["hedera", "hedera_testnet"],
    loadSetup: () => import("../families/hedera/setup"),
    loadTransaction: () => import("@ledgerhq/coin-hedera/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-hedera/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "icon",
    supportedCoins: ["icon", "icon_berlin_testnet"],
    loadSetup: () => import("../families/icon/setup"),
    loadTransaction: () => import("@ledgerhq/coin-icon/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-icon/deviceTransactionConfig").then(m => m.default),
    loadAccount: () => import("@ledgerhq/coin-icon/account").then(m => m.default),
    loadMockBridge: () => import("../families/icon/bridge/mock").then(m => m.default),
  },
  {
    family: "internet_computer",
    supportedCoins: ["internet_computer"],
    loadSetup: () => import("../families/internet_computer/setup"),
    loadTransaction: () =>
      import("@ledgerhq/coin-internet_computer/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-internet_computer/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "kaspa",
    supportedCoins: ["kaspa"],
    loadSetup: () => import("../families/kaspa/setup"),
    loadTransaction: () => import("@ledgerhq/coin-kaspa/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-kaspa/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "mina",
    supportedCoins: ["mina"],
    loadSetup: () => import("../families/mina/setup"),
    loadTransaction: () => import("@ledgerhq/coin-mina/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-mina/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "multiversx",
    supportedCoins: ["elrond"],
    loadSetup: () => import("../families/multiversx/setup"),
    loadTransaction: () => import("@ledgerhq/coin-multiversx/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-multiversx/deviceTransactionConfig").then(m => m.default),
    loadMockBridge: () => import("../families/multiversx/bridge/mock").then(m => m.default),
  },
  {
    family: "near",
    supportedCoins: ["near"],
    loadSetup: () => import("../families/near/setup"),
    loadTransaction: () => import("@ledgerhq/coin-near/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-near/deviceTransactionConfig").then(m => m.default),
    loadAccount: () => import("@ledgerhq/coin-near/account").then(m => m.default),
  },
  {
    family: "polkadot",
    supportedCoins: ["polkadot", "westend", "assethub_westend", "assethub_polkadot"],
    loadSetup: () => import("../families/polkadot/setup"),
    loadTransaction: () => import("@ledgerhq/coin-polkadot/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-polkadot/deviceTransactionConfig").then(m => m.default),
    loadWalletApiAdapter: () =>
      import("../families/polkadot/walletApiAdapter").then(m => m.default),
    loadPlatformAdapter: () => import("../families/polkadot/platformAdapter").then(m => m.default),
    loadMockBridge: () => import("../families/polkadot/bridge/mock").then(m => m.default),
  },
  {
    family: "solana",
    supportedCoins: ["solana", "solana_testnet", "solana_devnet"],
    loadSetup: () => import("../families/solana/setup"),
    loadTransaction: () => import("@ledgerhq/coin-solana/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-solana/deviceTransactionConfig").then(m => m.default),
    loadWalletApiAdapter: () => import("../families/solana/walletApiAdapter").then(m => m.default),
    loadMockBridge: () => import("../families/solana/bridge/mock").then(m => m.default),
    loadValidateAddress: () =>
      import("@ledgerhq/coin-solana/logic/validateAddress").then(
        ({ validateAddress }): ValidateAddressFn => validateAddress,
      ),
    loadSigner: () =>
      import("../bridge/generic-coin-framework/families/solana/signer").then(m => m.default),
  },
  {
    family: "stacks",
    supportedCoins: ["stacks"],
    loadSetup: () => import("../families/stacks/setup"),
    loadTransaction: () => import("@ledgerhq/coin-stacks/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-stacks/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "stellar",
    supportedCoins: ["stellar"],
    loadSetup: () => import("../families/stellar/setup"),
    loadTransaction: () => import("../families/stellar/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("../families/stellar/deviceTransactionConfig").then(m => m.default),
    loadMockBridge: () => import("../families/stellar/bridge/mock").then(m => m.default),
    loadValidateAddress: () =>
      import("@ledgerhq/coin-stellar/logic/validateAddress").then(
        ({ validateAddress }): ValidateAddressFn => validateAddress,
      ),
    loadSigner: () =>
      import("../bridge/generic-coin-framework/families/stellar/signer").then(m => m.default),
    loadBridgeExtensions: () => import("../families/stellar/bridgeExtensions").then(m => m.default),
  },
  {
    family: "sui",
    supportedCoins: ["sui", "sui_testnet"],
    loadSetup: () => import("../families/sui/setup"),
    loadTransaction: () => import("@ledgerhq/coin-sui/transaction").then(m => m.default),
    // No loadDeviceTxConfig: sui has no deviceTransactionConfig
  },
  {
    family: "tezos",
    supportedCoins: ["tezos"],
    loadSetup: () => import("../families/tezos/setup"),
    loadTransaction: () => import("../families/tezos/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("../families/tezos/deviceTransactionConfig").then(m => m.default),
    loadMockBridge: () => import("../families/tezos/bridge/mock").then(m => m.default),
    loadValidateAddress: () =>
      import("@ledgerhq/coin-tezos/logic/validateAddress").then(
        ({ validateAddress }): ValidateAddressFn => validateAddress,
      ),
    loadSigner: () =>
      import("../bridge/generic-coin-framework/families/tezos/signer").then(m => m.default),
    loadBridgeExtensions: () => import("../families/tezos/bridgeExtensions").then(m => m.default),
  },
  {
    family: "ton",
    supportedCoins: ["ton"],
    loadSetup: () => import("../families/ton/setup"),
    loadTransaction: () => import("@ledgerhq/coin-ton/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-ton/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "tron",
    supportedCoins: ["tron"],
    loadSetup: () => import("../families/tron/setup"),
    loadTransaction: () => import("@ledgerhq/coin-tron/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-tron/deviceTransactionConfig").then(m => m.default),
    loadMockBridge: () => import("../families/tron/bridge/mock").then(m => m.default),
    loadBridgeExtensions: () => import("../families/tron/bridgeExtensions").then(m => m.default),
  },
  {
    family: "vechain",
    supportedCoins: ["vechain"],
    loadSetup: () => import("../families/vechain/setup") as object as Promise<FamilySetup>,
    loadTransaction: () => import("@ledgerhq/coin-vechain/transaction").then(m => m.default),
    // No loadDeviceTxConfig: vechain has no deviceTransactionConfig
    loadAccount: () => import("@ledgerhq/coin-vechain/account").then(m => m.default),
    loadMockAccount: () => import("@ledgerhq/coin-vechain/mock").then(m => m.default),
    loadBridgeExtensions: () => import("../families/vechain/bridgeExtensions").then(m => m.default),
  },
  {
    family: "xrp",
    supportedCoins: ["ripple"],
    loadSetup: () => import("../families/xrp/setup"),
    loadTransaction: () => import("../families/xrp/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("../families/xrp/deviceTransactionConfig").then(m => m.default),
    loadWalletApiAdapter: () => import("../families/xrp/walletApiAdapter").then(m => m.default),
    loadPlatformAdapter: () => import("../families/xrp/platformAdapter").then(m => m.default),
    loadMockBridge: () => import("../families/xrp/bridge/mock").then(m => m.default),
    loadValidateAddress: () =>
      import("@ledgerhq/coin-xrp/api/validateAddress").then(
        ({ validateAddress }): ValidateAddressFn => validateAddress,
      ),
    loadSigner: () =>
      import("../bridge/generic-coin-framework/families/xrp/signer").then(m => m.default),
    loadBridgeExtensions: () => import("../families/xrp/bridgeExtensions").then(m => m.default),
  },
];
