import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client";
import { setSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import type { CoinModuleLoader } from "@ledgerhq/live-common/coin-modules/types";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setEnv } from "@ledgerhq/live-env";
import { registerWalletCliDmkTransport } from "./device/register-dmk-transport";

/**
 * Ensure USER_ID is set so DMK firmware distribution salt is stable for this CLI.
 */
if (!process.env.USER_ID) {
  process.env.USER_ID = "wallet-cli";
}

/**
 * Wallet-cli-specific coin-module loaders (bitcoin, evm, solana only).
 *
 * We define these inline instead of importing the shared coinModuleLoaders from live-common
 * because Bun's --compile bundler statically resolves all require() calls — even lazy ones
 * inside arrow functions — which would pull in every coin family's dependency tree (including
 * packages like @walletconnect/sign-client that break CJS/ESM interop under Bun).
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const walletCliLoaders: CoinModuleLoader[] = [
  {
    family: "bitcoin",
    loadSetup: () => require("@ledgerhq/live-common/families/bitcoin/setup"),
    loadTransaction: () => require("@ledgerhq/coin-bitcoin/transaction").default,
    loadDeviceTxConfig: () => require("@ledgerhq/coin-bitcoin/deviceTransactionConfig").default,
    loadWalletApiAdapter: () => require("@ledgerhq/live-common/families/bitcoin/walletApiAdapter").default,
    loadPlatformAdapter: () => require("@ledgerhq/live-common/families/bitcoin/platformAdapter").default,
    loadAccount: () => require("@ledgerhq/coin-bitcoin/account").default,
  },
  {
    family: "evm",
    loadSetup: () => require("@ledgerhq/live-common/families/evm/setup"),
    loadTransaction: () => require("@ledgerhq/coin-evm/transaction").default,
    loadDeviceTxConfig: () => require("@ledgerhq/coin-evm/deviceTransactionConfig").default,
    loadWalletApiAdapter: () => require("@ledgerhq/live-common/families/evm/walletApiAdapter").default,
    loadPlatformAdapter: () => require("@ledgerhq/live-common/families/evm/platformAdapter").default,
  },
  {
    family: "solana",
    loadSetup: () => require("@ledgerhq/live-common/families/solana/setup"),
    loadTransaction: () => require("@ledgerhq/coin-solana/transaction").default,
    loadDeviceTxConfig: () => require("@ledgerhq/coin-solana/deviceTransactionConfig").default,
    loadWalletApiAdapter: () => require("@ledgerhq/live-common/families/solana/walletApiAdapter").default,
  },
];

setWalletAPIVersion(WALLET_API_VERSION);
registerCoinModules(walletCliLoaders);
setSupportedCurrencies(["bitcoin", "ethereum", "solana"]);
// Set config on the ESM singleton (used by alpacaized families like EVM whose
// bridge code is reached through ESM imports).
LiveConfig.setConfig(liveConfig);
// Also set on the CJS singleton — Bun's bundler resolves ESM imports to lib-es/
// and require() to lib/, creating separate LiveConfig.instance singletons.
// Non-alpacaized families (solana, bitcoin) load their bridge via require() in
// the lazy loaders above, so they read from the CJS instance.
(require("@ledgerhq/live-config/LiveConfig") as typeof import("@ledgerhq/live-config/LiveConfig")).LiveConfig.setConfig(liveConfig);
// TODO: wallet-cli should own its Redux store setup (createRtkCryptoAssetsStore + RTK middleware)
// instead of relying on setupCalClientStore from @ledgerhq/cryptoassets/cal-client (test-helpers).
setupCalClientStore();
// Also require() — the ESM import would set the flag on a different module instance
// than the CJS setup.ts loaded by the lazy loaders above.
(require("@ledgerhq/live-common/families/solana/setup") as typeof import("@ledgerhq/live-common/families/solana/setup")).setSolanaLdmkEnabled(true);
registerWalletCliDmkTransport();

setEnv("LEDGER_CLIENT_VERSION", "wallet-cli/0.1.0");
