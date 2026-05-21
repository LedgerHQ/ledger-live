import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client";
import { setSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { walletCliConfig } from "./config";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import type { CoinModuleLoader } from "@ledgerhq/live-common/coin-modules/types";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setEnv } from "@ledgerhq/live-env";
import { registerWalletCliDmkTransport } from "./device/register-dmk-transport";
import pkg from "../package.json" with { type: "json" };
import type { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";

/**
 * Ensure USER_ID is set so DMK firmware distribution salt is stable for this CLI.
 */
if (!process.env.USER_ID) {
  process.env.USER_ID = "wallet-cli";
}

const ledgerClientVersion = `wallet-cli/${pkg.version}`;
setEnv("LEDGER_CLIENT_VERSION", ledgerClientVersion);
process.env.LEDGER_CLIENT_VERSION = ledgerClientVersion;
// Bun can resolve ESM imports to lib-es/ and require() calls to lib/, creating
// separate live-env singletons. Keep both aligned for lazy CJS coin modules.
require("@ledgerhq/live-env").setEnv("LEDGER_CLIENT_VERSION", ledgerClientVersion);

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
    loadWalletApiAdapter: () =>
      require("@ledgerhq/live-common/families/bitcoin/walletApiAdapter").default,
    loadPlatformAdapter: () =>
      require("@ledgerhq/live-common/families/bitcoin/platformAdapter").default,
    loadAccount: () => require("@ledgerhq/coin-bitcoin/account").default,
  },
  {
    family: "evm",
    loadSetup: () => require("@ledgerhq/live-common/families/evm/setup"),
    loadTransaction: () => require("@ledgerhq/coin-evm/transaction").default,
    loadDeviceTxConfig: () => require("@ledgerhq/coin-evm/deviceTransactionConfig").default,
    loadWalletApiAdapter: () =>
      require("@ledgerhq/live-common/families/evm/walletApiAdapter").default,
    loadPlatformAdapter: () =>
      require("@ledgerhq/live-common/families/evm/platformAdapter").default,
    loadValidateAddress: () => require("@ledgerhq/coin-evm/logic/validateAddress").validateAddress,
    loadSigner: () =>
      require("@ledgerhq/live-common/bridge/generic-coin-framework/families/evm/signer").default,
  },
  {
    family: "solana",
    loadSetup: () => {
      const setup = require("@ledgerhq/live-common/families/solana/setup");
      // Set on the CJS instance here (lazily) rather than eagerly at startup.
      // The ESM import resolves to a different module instance than this require();
      // calling it inside loadSetup ensures the flag is set on the exact instance
      // that registerCoinModules will use, without paying the ~700ms require cost
      // on every subprocess that never runs a Solana command.
      setup.setSolanaLdmkEnabled(true);
      return setup;
    },
    loadTransaction: () => require("@ledgerhq/coin-solana/transaction").default,
    loadDeviceTxConfig: () => require("@ledgerhq/coin-solana/deviceTransactionConfig").default,
    loadWalletApiAdapter: () =>
      require("@ledgerhq/live-common/families/solana/walletApiAdapter").default,
    loadSigner: () =>
      require("@ledgerhq/live-common/bridge/generic-coin-framework/families/solana/signer").default,
  },
];

export const WALLET_CLI_SUPPORTED_CRYPTO_CURRENCY_IDS: readonly CryptoCurrencyId[] = [
  "bitcoin",
  "ethereum",
  "solana",
];

setWalletAPIVersion(WALLET_API_VERSION);
registerCoinModules(walletCliLoaders);
setSupportedCurrencies([...WALLET_CLI_SUPPORTED_CRYPTO_CURRENCY_IDS]);
// Set config on the ESM singleton (used by coin-framework families like EVM whose
// bridge code is reached through ESM imports).
LiveConfig.setConfig(walletCliConfig);
// Also set on the CJS singleton — Bun's bundler resolves ESM imports to lib-es/
// and require() to lib/, creating separate LiveConfig.instance singletons.
// Non-coin-framework families (solana, bitcoin) load their bridge via require() in
// the lazy loaders above, so they read from the CJS instance.
require("@ledgerhq/live-config/LiveConfig").LiveConfig.setConfig(walletCliConfig);
// TODO: wallet-cli should own its Redux store setup (createRtkCryptoAssetsStore + RTK middleware)
// instead of relying on setupCalClientStore from @ledgerhq/cryptoassets/cal-client (test-helpers).
setupCalClientStore();
registerWalletCliDmkTransport();
