import { buildStandaloneCryptoAssetsStore } from "@features/platform-currencies/legacy";
import { walletCliConfig } from "./config";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import type { CoinModuleLoader } from "@ledgerhq/live-common/coin-modules/types";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import { setupStandaloneSwapQuotesStore } from "@ledgerhq/live-common/wallet-api/Exchange/quotes/state-manager/standaloneStore";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setEnv, getEnv } from "@shared/env";
import { bridgeEnvToNetworkState } from "@ledgerhq/live-common/network/setup";
import { registerWalletCliDmkTransport } from "./device/register-dmk-transport";
import {
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
  CryptoCurrencyIdSchema,
  type CryptoCurrencyId,
} from "@domain/entity-currency-crypto";
import { setCurrenciesResolver } from "@ledgerhq/ledger-wallet-framework/currencies";
import { setCryptoAssetsStore as setFrameworkCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import pkg from "../package.json" with { type: "json" };

/**
 * Ensure USER_ID is set so DMK firmware distribution salt is stable for this CLI.
 */
if (!process.env.USER_ID) {
  process.env.USER_ID = "wallet-cli";
}

const ledgerClientVersion = `wallet-cli/${pkg.version}`;
setEnv("LEDGER_CLIENT_VERSION", ledgerClientVersion);
process.env.LEDGER_CLIENT_VERSION = ledgerClientVersion;
bridgeEnvToNetworkState();

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
      import("@ledgerhq/live-common/families/evm/accountRawAssign").then(m => m.default),
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

export const WALLET_CLI_SUPPORTED_CRYPTO_CURRENCY_IDS: readonly CryptoCurrencyId[] = [
  CryptoCurrencyIdSchema.parse("bitcoin"),
  CryptoCurrencyIdSchema.parse("ethereum"),
  CryptoCurrencyIdSchema.parse("solana"),
];

setCurrenciesResolver({
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
});
setWalletAPIVersion(WALLET_API_VERSION);
registerCoinModules(walletCliLoaders);
LiveConfig.setConfig(walletCliConfig);
setFrameworkCryptoAssetsStore(
  buildStandaloneCryptoAssetsStore({
    calServiceUrl: getEnv("CAL_SERVICE_URL"),
    ledgerClientVersion,
  }),
);
// `getQuotes` needs a store dispatch; wallet-cli has no app Redux store.
setupStandaloneSwapQuotesStore({
  swapApiBaseUrl: getEnv("SWAP_API_BASE"),
  ledgerClientVersion,
});
registerWalletCliDmkTransport();
