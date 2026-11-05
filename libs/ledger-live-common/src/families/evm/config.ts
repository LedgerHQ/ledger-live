import { isPlainObjectOverride } from "@ledgerhq/live-config/LiveConfig";
import { evmDefaults } from "@ledgerhq/coin-evm/config";
import { getEnv } from "@shared/env";
import { CurrencyLiveConfigDefinition, currencyDefaultsToLiveConfig } from "../../config";

export function isLedgerBased(currencyConfiguration: Record<string, unknown>): boolean {
  return Boolean(
    typeof currencyConfiguration.default === "object" &&
    currencyConfiguration.default &&
    "node" in currencyConfiguration.default &&
    currencyConfiguration.default.node &&
    typeof currencyConfiguration.default.node === "object" &&
    "type" in currencyConfiguration.default.node &&
    currencyConfiguration.default.node.type === "ledger",
  );
}

function envBasedLedgerConfiguration(): Record<string, unknown> {
  return {
    ...(getEnv("EXPLORER") ? { ledgerExplorerUri: getEnv("EXPLORER") } : {}),
    ...(getEnv("LEDGER_CLIENT_VERSION")
      ? { ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION") }
      : {}),
    ...(getEnv("EIP1559_BASE_FEE_MULTIPLIER")
      ? { eip1559BaseFeeMultiplier: getEnv("EIP1559_BASE_FEE_MULTIPLIER") }
      : {}),
  };
}

function overridesDefaultsWithEnv(
  walletCurrenciesConfiguration: CurrencyLiveConfigDefinition,
): CurrencyLiveConfigDefinition {
  return Object.fromEntries(
    Object.entries(walletCurrenciesConfiguration).map(([currencyName, currencyConfiguration]) => [
      currencyName,
      {
        type: "object" as const,
        get default() {
          return isPlainObjectOverride(currencyConfiguration.default)
            ? {
                ...currencyConfiguration.default,
                ...(isLedgerBased(currencyConfiguration) ? envBasedLedgerConfiguration() : {}),
                // DRAFT ONLY, never merge: route Ethereum mainnet to Codex (Fresnel staging).
                ...(currencyName === "config_currency_ethereum"
                  ? { ledgerExplorerUri: "https://fresnel.api.live.ledger-test.com" }
                  : {}),
                ...(getEnv("EVM_FORCE_LEGACY_TRANSACTIONS")
                  ? { forceLegacyTransactions: getEnv("EVM_FORCE_LEGACY_TRANSACTIONS") }
                  : {}),
              }
            : {};
        },
      },
    ]),
  );
}

const evmCurrencies = currencyDefaultsToLiveConfig(evmDefaults);

export const evmConfig = overridesDefaultsWithEnv(evmCurrencies);
