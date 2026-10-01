import type { CoinModuleLoader } from "@ledgerhq/live-common/coin-modules/types";

/**
 * Wallet-cli-specific coin-module loaders (bitcoin, evm, solana only).
 *
 * We define these inline instead of importing the shared coinModuleLoaders from live-common
 * because Bun's --compile bundler statically resolves every import — pulling in the shared
 * list would drag in every coin family's dependency tree (including packages like
 * @walletconnect/sign-client that break CJS/ESM interop under Bun).
 *
 * `supportedCoins` is also the list of networks wallet-cli accepts (testnets follow their
 * mainnet): add a currency id there to support it, e.g. "base" under evm. Keep this module free
 * of side effects: shared/supported-currencies.ts reads it without running live-common-setup.
 */
export const walletCliLoaders: CoinModuleLoader[] = [
  {
    family: "bitcoin",
    supportedCoins: ["bitcoin"],
    loadSetup: () => import("@ledgerhq/live-common/families/bitcoin/setup"),
    loadTransaction: () => import("@ledgerhq/coin-bitcoin/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-bitcoin/deviceTransactionConfig").then(m => m.default),
    loadWalletApiAdapter: () =>
      import("@ledgerhq/live-common/families/bitcoin/walletApiAdapter").then(m => m.default),
    loadPlatformAdapter: () =>
      import("@ledgerhq/live-common/families/bitcoin/platformAdapter").then(m => m.default),
    loadAccount: () => import("@ledgerhq/coin-bitcoin/account").then(m => m.default),
  },
  {
    family: "evm",
    supportedCoins: ["ethereum"],
    loadSetup: () => import("@ledgerhq/live-common/families/evm/setup"),
    loadTransaction: () =>
      import("@ledgerhq/live-common/families/evm/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/live-common/families/evm/deviceTransactionConfig").then(m => m.default),
    loadWalletApiAdapter: () =>
      import("@ledgerhq/live-common/families/evm/walletApiAdapter").then(m => m.default),
    loadPlatformAdapter: () =>
      import("@ledgerhq/live-common/families/evm/platformAdapter").then(m => m.default),
    loadSigner: () => import("@ledgerhq/live-common/families/evm/signer").then(m => m.default),
    loadBridgeApi: () =>
      import("@ledgerhq/live-common/families/evm/bridge/api").then(m => m.default),
    loadAccountRawAssign: () =>
      import("@ledgerhq/live-common/bridge/generic-coin-framework/accountRawAssign").then(
        m => m.default,
      ),
    loadLocalApi: () =>
      import("@ledgerhq/live-common/families/evm/coinModuleApi").then(m => m.createLocalEvmApi),
  },
  {
    family: "solana",
    supportedCoins: ["solana"],
    loadSetup: () =>
      import("@ledgerhq/live-common/families/solana/setup").then(setup => {
        // Set on the resolved instance lazily rather than eagerly at startup,
        // ensuring the flag is set on the exact instance registerCoinModules will use,
        // without paying the load cost on subprocesses that never run a Solana command.
        setup.setSolanaLdmkEnabled(true);
        return setup;
      }),
    loadTransaction: () => import("@ledgerhq/coin-solana/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-solana/deviceTransactionConfig").then(m => m.default),
    loadWalletApiAdapter: () =>
      import("@ledgerhq/live-common/families/solana/walletApiAdapter").then(m => m.default),
    loadSigner: () => import("@ledgerhq/live-common/families/solana/signer").then(m => m.default),
    loadBridgeApi: () =>
      import("@ledgerhq/live-common/families/solana/bridge/api").then(m => m.default),
    loadLocalApi: () =>
      import("@ledgerhq/live-common/families/solana/coinModuleApi").then(
        m => m.createLocalSolanaApi,
      ),
  },
];
