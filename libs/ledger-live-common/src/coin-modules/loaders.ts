import type { CoinModuleLoader, FamilySetup, ValidateAddressFn } from "./types";

// Hand-maintained: one entry per coin family. See FUTURE.md for the async evolution plan.
export const coinModuleLoaders: CoinModuleLoader[] = [
  {
    family: "aleo",
    loadSetup: () => import("../families/aleo/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-aleo/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-aleo/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "algorand",
    loadSetup: () => import("../families/algorand/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-algorand/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-algorand/deviceTransactionConfig").then(m => m.default),
    loadMockBridge: () => import("../families/algorand/bridge/mock.js").then(m => m.default),
    loadMockAccount: () => import("@ledgerhq/coin-algorand/mock").then(m => m.default),
  },
  {
    family: "aptos",
    loadSetup: () => import("../families/aptos/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-aptos/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-aptos/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "bitcoin",
    loadSetup: () => import("../families/bitcoin/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-bitcoin/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-bitcoin/deviceTransactionConfig").then(m => m.default),
    loadWalletApiAdapter: () =>
      import("../families/bitcoin/walletApiAdapter.js").then(m => m.default),
    loadPlatformAdapter: () =>
      import("../families/bitcoin/platformAdapter.js").then(m => m.default),
    loadAccount: () => import("@ledgerhq/coin-bitcoin/account").then(m => m.default),
    loadMockBridge: () => import("../families/bitcoin/bridge/mock.js").then(m => m.default),
    loadBridgeExtensions: () =>
      import("../families/bitcoin/bridgeExtensions.js").then(m => m.default),
  },
  {
    family: "canton",
    loadSetup: () => import("../families/canton/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-canton/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-canton/deviceTransactionConfig").then(m => m.default),
    loadMockBridge: () => import("../families/canton/bridge/mock.js").then(m => m.default),
    loadBridgeExtensions: () =>
      import("../families/canton/bridgeExtensions.js").then(m => m.default),
  },
  {
    family: "cardano",
    loadSetup: () => import("../families/cardano/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-cardano/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-cardano/deviceTransactionConfig").then(m => m.default),
    loadAccount: () => import("@ledgerhq/coin-cardano/account").then(m => m.default),
    loadMockBridge: () => import("../families/cardano/bridge/mock.js").then(m => m.default),
  },
  {
    family: "casper",
    loadSetup: () => import("../families/casper/setup.js") as object as Promise<FamilySetup>,
    loadTransaction: () => import("@ledgerhq/coin-casper/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-casper/deviceTransactionConfig").then(m => m.default),
    loadMockBridge: () => import("../families/casper/bridge/mock.js").then(m => m.default),
  },
  {
    family: "celo",
    loadSetup: () => import("../families/celo/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-celo/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-celo/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "concordium",
    loadSetup: () => import("../families/concordium/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-concordium/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-concordium/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "cosmos",
    loadSetup: () => import("../families/cosmos/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-cosmos/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-cosmos/deviceTransactionConfig").then(m => m.default),
    loadWalletApiAdapter: () =>
      import("../families/cosmos/walletApiAdapter.js").then(m => m.default),
    loadMockBridge: () => import("../families/cosmos/bridge/mock.js").then(m => m.default),
    loadMockAccount: () => import("@ledgerhq/coin-cosmos/mock").then(m => m.default),
    loadBridgeExtensions: () =>
      import("../families/cosmos/bridgeExtensions.js").then(m => m.default),
  },
  {
    family: "evm",
    loadSetup: () => import("../families/evm/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-evm/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-evm/deviceTransactionConfig").then(m => m.default),
    loadWalletApiAdapter: () => import("../families/evm/walletApiAdapter.js").then(m => m.default),
    loadPlatformAdapter: () => import("../families/evm/platformAdapter.js").then(m => m.default),
    loadMockBridge: () => import("../families/evm/bridge/mock.js").then(m => m.default),
    loadValidateAddress: () =>
      import("@ledgerhq/coin-evm/logic/validateAddress").then(
        ({ validateAddress }): ValidateAddressFn => validateAddress,
      ),
    loadSigner: () =>
      import("../bridge/generic-coin-framework/families/evm/signer.js").then(m => m.default),
    loadBridgeExtensions: () =>
      import("../families/evm/bridgeExtensions.js").then(m => m.default),
  },
  {
    family: "filecoin",
    loadSetup: () => import("../families/filecoin/setup.js") as object as Promise<FamilySetup>,
    loadTransaction: () => import("@ledgerhq/coin-filecoin/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-filecoin/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "hedera",
    loadSetup: () => import("../families/hedera/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-hedera/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-hedera/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "icon",
    loadSetup: () => import("../families/icon/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-icon/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-icon/deviceTransactionConfig").then(m => m.default),
    loadAccount: () => import("@ledgerhq/coin-icon/account").then(m => m.default),
    loadMockBridge: () => import("../families/icon/bridge/mock.js").then(m => m.default),
  },
  {
    family: "internet_computer",
    loadSetup: () =>
      import("../families/internet_computer/setup.js") as object as Promise<FamilySetup>,
    loadTransaction: () =>
      import("@ledgerhq/coin-internet_computer/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-internet_computer/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "kaspa",
    loadSetup: () => import("../families/kaspa/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-kaspa/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-kaspa/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "mina",
    loadSetup: () => import("../families/mina/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-mina/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-mina/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "multiversx",
    loadSetup: () => import("../families/multiversx/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-multiversx/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-multiversx/deviceTransactionConfig").then(m => m.default),
    loadMockBridge: () => import("../families/multiversx/bridge/mock.js").then(m => m.default),
  },
  {
    family: "near",
    loadSetup: () => import("../families/near/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-near/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-near/deviceTransactionConfig").then(m => m.default),
    loadAccount: () => import("@ledgerhq/coin-near/account").then(m => m.default),
  },
  {
    family: "polkadot",
    loadSetup: () => import("../families/polkadot/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-polkadot/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-polkadot/deviceTransactionConfig").then(m => m.default),
    loadWalletApiAdapter: () =>
      import("../families/polkadot/walletApiAdapter.js").then(m => m.default),
    loadPlatformAdapter: () =>
      import("../families/polkadot/platformAdapter.js").then(m => m.default),
    loadMockBridge: () => import("../families/polkadot/bridge/mock.js").then(m => m.default),
  },
  {
    family: "solana",
    loadSetup: () => import("../families/solana/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-solana/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-solana/deviceTransactionConfig").then(m => m.default),
    loadWalletApiAdapter: () =>
      import("../families/solana/walletApiAdapter.js").then(m => m.default),
    loadMockBridge: () => import("../families/solana/bridge/mock.js").then(m => m.default),
    loadValidateAddress: () =>
      import("@ledgerhq/coin-solana/logic/validateAddress").then(
        ({ validateAddress }): ValidateAddressFn => validateAddress,
      ),
    loadSigner: () =>
      import("../bridge/generic-coin-framework/families/solana/signer.js").then(m => m.default),
  },
  {
    family: "stacks",
    loadSetup: () => import("../families/stacks/setup.js") as object as Promise<FamilySetup>,
    loadTransaction: () => import("@ledgerhq/coin-stacks/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-stacks/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "stellar",
    loadSetup: () => import("../families/stellar/setup.js"),
    loadTransaction: () => import("../families/stellar/transaction.js").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("../families/stellar/deviceTransactionConfig.js").then(m => m.default),
    loadMockBridge: () => import("../families/stellar/bridge/mock.js").then(m => m.default),
    loadValidateAddress: () =>
      import("@ledgerhq/coin-stellar/logic/validateAddress").then(
        ({ validateAddress }): ValidateAddressFn => validateAddress,
      ),
    loadSigner: () =>
      import("../bridge/generic-coin-framework/families/stellar/signer.js").then(m => m.default),
  },
  {
    family: "sui",
    loadSetup: () => import("../families/sui/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-sui/transaction").then(m => m.default),
    // No loadDeviceTxConfig: sui has no deviceTransactionConfig
  },
  {
    family: "tezos",
    loadSetup: () => import("../families/tezos/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-tezos/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-tezos/deviceTransactionConfig").then(m => m.default),
    loadMockBridge: () => import("../families/tezos/bridge/mock.js").then(m => m.default),
    loadValidateAddress: () =>
      import("@ledgerhq/coin-tezos/logic/validateAddress").then(
        ({ validateAddress }): ValidateAddressFn => validateAddress,
      ),
    loadSigner: () =>
      import("../bridge/generic-coin-framework/families/tezos/signer.js").then(m => m.default),
    loadBridgeExtensions: () =>
      import("../families/tezos/bridgeExtensions.js").then(m => m.default),
  },
  {
    family: "ton",
    loadSetup: () => import("../families/ton/setup.js") as object as Promise<FamilySetup>,
    loadTransaction: () => import("@ledgerhq/coin-ton/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-ton/deviceTransactionConfig").then(m => m.default),
  },
  {
    family: "tron",
    loadSetup: () => import("../families/tron/setup.js"),
    loadTransaction: () => import("@ledgerhq/coin-tron/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-tron/deviceTransactionConfig").then(m => m.default),
    loadMockBridge: () => import("../families/tron/bridge/mock.js").then(m => m.default),
    loadBridgeExtensions: () =>
      import("../families/tron/bridgeExtensions.js").then(m => m.default),
  },
  {
    family: "vechain",
    loadSetup: () => import("../families/vechain/setup.js") as object as Promise<FamilySetup>,
    loadTransaction: () => import("@ledgerhq/coin-vechain/transaction").then(m => m.default),
    // No loadDeviceTxConfig: vechain has no deviceTransactionConfig
    loadAccount: () => import("@ledgerhq/coin-vechain/account").then(m => m.default),
    loadMockAccount: () => import("@ledgerhq/coin-vechain/mock").then(m => m.default),
    loadBridgeExtensions: () =>
      import("../families/vechain/bridgeExtensions.js").then(m => m.default),
  },
  {
    family: "xrp",
    loadSetup: () => import("../families/xrp/setup.js"),
    loadTransaction: () => import("../families/xrp/transaction.js").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("../families/xrp/deviceTransactionConfig.js").then(m => m.default),
    loadWalletApiAdapter: () => import("../families/xrp/walletApiAdapter.js").then(m => m.default),
    loadPlatformAdapter: () => import("../families/xrp/platformAdapter.js").then(m => m.default),
    loadMockBridge: () => import("../families/xrp/bridge/mock.js").then(m => m.default),
    loadValidateAddress: () =>
      import("@ledgerhq/coin-xrp/logic/validateAddress").then(
        ({ validateAddress }): ValidateAddressFn => validateAddress,
      ),
    loadSigner: () =>
      import("../bridge/generic-coin-framework/families/xrp/signer.js").then(m => m.default),
  },
];
