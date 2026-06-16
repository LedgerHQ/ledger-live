import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client";
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

/**
 * Wallet-cli-specific coin-module loaders (bitcoin, evm, solana only).
 *
 * We define these inline instead of importing the shared coinModuleLoaders from live-common
 * because Bun's --compile bundler statically resolves every import — pulling in the shared
 * list would drag in every coin family's dependency tree (including packages like
 * @walletconnect/sign-client that break CJS/ESM interop under Bun).
 */
const walletCliLoaders: CoinModuleLoader[] = [
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
    loadTransaction: () => import("@ledgerhq/coin-evm/transaction").then(m => m.default),
    loadDeviceTxConfig: () =>
      import("@ledgerhq/coin-evm/deviceTransactionConfig").then(m => m.default),
    loadWalletApiAdapter: () =>
      import("@ledgerhq/live-common/families/evm/walletApiAdapter").then(m => m.default),
    loadPlatformAdapter: () =>
      import("@ledgerhq/live-common/families/evm/platformAdapter").then(m => m.default),
    loadValidateAddress: () =>
      import("@ledgerhq/coin-evm/logic/validateAddress").then(m => m.validateAddress),
    loadSigner: () =>
      import("@ledgerhq/live-common/bridge/generic-coin-framework/families/evm/signer").then(
        m => m.default,
      ),
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
    loadSigner: () =>
      import("@ledgerhq/live-common/bridge/generic-coin-framework/families/solana/signer").then(
        m => m.default,
      ),
  },
];

export const WALLET_CLI_SUPPORTED_CRYPTO_CURRENCY_IDS: readonly CryptoCurrencyId[] = [
  "bitcoin",
  "ethereum",
  "solana",
];

setWalletAPIVersion(WALLET_API_VERSION);
registerCoinModules(walletCliLoaders);
LiveConfig.setConfig(walletCliConfig);
// TODO: wallet-cli should own its Redux store setup (createRtkCryptoAssetsStore + RTK middleware)
// instead of relying on setupCalClientStore from @ledgerhq/cryptoassets/cal-client (test-helpers).
setupCalClientStore();
registerWalletCliDmkTransport();
