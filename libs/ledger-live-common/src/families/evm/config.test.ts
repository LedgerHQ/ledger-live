import { getEnv, getEnvDefault, setEnv } from "@shared/env";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getCurrencyConfiguration } from "../../config";
import { liveConfig } from "../../config/sharedConfig";
import { evmConfig, isLedgerBased } from "./config";

describe("evmConfig", () => {
  beforeEach(() => {
    LiveConfig.setConfig(evmConfig as never);

    setEnv("EXPLORER", getEnvDefault("EXPLORER")); // defaultLedgerExplorerUri);
    setEnv("LEDGER_CLIENT_VERSION", getEnvDefault("LEDGER_CLIENT_VERSION")); //defaultLedgerClientVersion);
    setEnv("EIP1559_BASE_FEE_MULTIPLIER", getEnvDefault("EIP1559_BASE_FEE_MULTIPLIER")); //defaultEip1559BaseFeeMultiplier);
    setEnv("EVM_FORCE_LEGACY_TRANSACTIONS", getEnvDefault("EVM_FORCE_LEGACY_TRANSACTIONS")); //defaultForceLegacyTransactions);
  });

  it("should override with env variables Ledger based currency configuration", () => {
    setEnv("EXPLORER", "http://url-2.url");
    setEnv("LEDGER_CLIENT_VERSION", "4.0");
    setEnv("EIP1559_BASE_FEE_MULTIPLIER", 2.5);

    expect(getCurrencyConfiguration("ethereum")).toMatchObject({
      ledgerExplorerUri: "http://url-2.url",
      ledgerClientVersion: "4.0",
      eip1559BaseFeeMultiplier: 2.5,
    });
  });

  it("should override forceLegacyTransactions with env variables when available", () => {
    expect(getCurrencyConfiguration("ethereum")).not.toHaveProperty("forceLegacyTransactions");

    setEnv("EVM_FORCE_LEGACY_TRANSACTIONS", true);

    expect(getCurrencyConfiguration("ethereum")).toMatchObject({
      forceLegacyTransactions: true,
    });
  });

  it("should not override with env variables currency configuration when not available", () => {
    setEnv("EXPLORER", "");
    setEnv("LEDGER_CLIENT_VERSION", "");
    setEnv("EIP1559_BASE_FEE_MULTIPLIER", 0);
    setEnv("EVM_FORCE_LEGACY_TRANSACTIONS", false);

    const previousConfiguration = getCurrencyConfiguration("ethereum");
    expect(previousConfiguration).not.toHaveProperty("ledgerExplorerUri");
    expect(previousConfiguration).not.toHaveProperty("ledgerClientVersion");
    expect(previousConfiguration).not.toHaveProperty("eip1559BaseFeeMultiplier");
    expect(previousConfiguration).not.toHaveProperty("forceLegacyTransactions");
  });

  it("should not add specific env variables to non Ledger based currency configuration", () => {
    const config = getCurrencyConfiguration("arbitrum");

    expect(config).not.toHaveProperty("ledgerExplorerUri");
    expect(config).not.toHaveProperty("ledgerClientVersion");
    expect(config).not.toHaveProperty("eip1559BaseFeeMultiplier");
  });

  it("should reflects an env change made after configuration load", () => {
    setEnv("EIP1559_BASE_FEE_MULTIPLIER", 5.5);
    setEnv("EXPLORER", "http://url.url");

    expect(getCurrencyConfiguration("ethereum")).toMatchObject({
      eip1559BaseFeeMultiplier: 5.5,
      ledgerExplorerUri: "http://url.url",
    });

    setEnv("EIP1559_BASE_FEE_MULTIPLIER", 3.5);
    setEnv("EXPLORER", "https://explorer.test");

    expect(getCurrencyConfiguration("ethereum")).toMatchObject({
      eip1559BaseFeeMultiplier: 3.5,
      ledgerExplorerUri: "https://explorer.test",
    });
  });

  it("should stays live once assembled into the shared schema", () => {
    const previousExplorerUri = getEnv("EXPLORER");
    LiveConfig.setConfig(liveConfig);
    setEnv("EXPLORER", "https://spread.test");

    expect(getCurrencyConfiguration("ethereum").ledgerExplorerUri).toBe("https://spread.test");

    setEnv("EXPLORER", previousExplorerUri);
    LiveConfig.setConfig(evmConfig as never);
  });

  it("should preserve the specific currency configuration fields after loading", () => {
    setEnv("EXPLORER", "http://some-random-url.url");
    setEnv("LEDGER_CLIENT_VERSION", "4.0");
    setEnv("EIP1559_BASE_FEE_MULTIPLIER", 2.5);
    setEnv("EVM_FORCE_LEGACY_TRANSACTIONS", true);

    // polygon pins its own minGasPrice.
    expect(getCurrencyConfiguration("polygon")).toMatchObject({
      minGasPrice: "25000000000",
      ledgerExplorerUri: "http://some-random-url.url",
      ledgerClientVersion: "4.0",
      eip1559BaseFeeMultiplier: 2.5,
      forceLegacyTransactions: true,
    });
  });
});

describe("isLedgerBased", () => {
  it("should return true for a Ledger based configuration", () => {
    const currency = {
      default: {
        node: {
          type: "ledger",
        },
      },
    };

    expect(isLedgerBased(currency)).toEqual(true);
  });

  it("should return false for a non Ledger based configuration", () => {
    const currency = {
      default: {
        node: {
          type: "external",
        },
      },
    };

    expect(isLedgerBased(currency)).toEqual(false);
  });
});
