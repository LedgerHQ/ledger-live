import type { SolanaCoinConfig } from "../../config";
import {
  DEFAULT_LEDGER_VALIDATORS,
  DEFAULT_TX_FEE,
  LEDGER_VALIDATOR_BY_BITWISE,
  LEDGER_VALIDATOR_BY_FIGMENT,
} from "../../constants";
import type { ValidatorsAppValidator } from "../../network/validator-app";
import { TEST_CONFIG } from "../../test/coinConfig";
import {
  chainConfigFrom,
  defaultLedgerValidatorOf,
  endpointByCurrencyId,
  feesOf,
  ledgerFirstValidators,
  ledgerValidatorsOf,
} from "../../utils";

const configWithRpcUrls = (rpcUrls: SolanaCoinConfig["rpcUrls"]): SolanaCoinConfig =>
  ({ token2022Enabled: false, legacyOCMSMaxVersion: "1.0.0", rpcUrls }) as SolanaCoinConfig;

describe("utils - endpointByCurrencyId", () => {
  const config = configWithRpcUrls({
    solana: "https://custom-mainnet.example.com",
    solana_devnet: "https://custom-devnet.example.com",
    solana_testnet: "https://custom-testnet.example.com",
  });

  it.each([
    ["solana", "https://custom-mainnet.example.com"],
    ["solana_devnet", "https://custom-devnet.example.com"],
    ["solana_testnet", "https://custom-testnet.example.com"],
  ])("uses the configured URL for %s", (currencyId, url) => {
    expect(endpointByCurrencyId(config, currencyId)).toBe(url);
  });

  it.each(["solana", "solana_devnet", "solana_testnet"])(
    "throws when the coin config has no URL for %s",
    currencyId => {
      expect(() => endpointByCurrencyId(configWithRpcUrls({}), currencyId)).toThrow(
        `no rpcUrls.${currencyId}`,
      );
    },
  );

  it("throws for unknown currency ids", () => {
    expect(() => endpointByCurrencyId(config, "solana_unknown")).toThrow(
      /unexpected currency id format/,
    );
  });
});

describe("utils - Default Validators", () => {
  it("should have APY property", () => {
    expect(LEDGER_VALIDATOR_BY_FIGMENT).toMatchObject({ apy: expect.any(Number) });
    expect(LEDGER_VALIDATOR_BY_BITWISE).toMatchObject({ apy: expect.any(Number) });
  });
  it("should have different APY values", () => {
    expect(LEDGER_VALIDATOR_BY_FIGMENT.apy).not.toBe(LEDGER_VALIDATOR_BY_BITWISE.apy);
  });

  it("puts the Figment validator first", () => {
    expect(DEFAULT_LEDGER_VALIDATORS[0]).toBe(LEDGER_VALIDATOR_BY_FIGMENT);
  });
});

const validator = (voteAccount: string): ValidatorsAppValidator => ({
  voteAccount,
  activeStake: 1,
  commission: 1,
  totalScore: 1,
});

describe("utils - Ledger validators from the coin config", () => {
  it("falls back to the module default", () => {
    expect(ledgerValidatorsOf(TEST_CONFIG)).toBe(DEFAULT_LEDGER_VALIDATORS);
    expect(defaultLedgerValidatorOf(TEST_CONFIG)).toBe(LEDGER_VALIDATOR_BY_FIGMENT);
  });

  it("reads the configured list, default validator first", () => {
    const configured = [validator("ledger-a"), validator("ledger-b")];
    const config = { ...TEST_CONFIG, staking: { ledgerValidators: configured } };

    expect(ledgerValidatorsOf(config)).toBe(configured);
    expect(defaultLedgerValidatorOf(config)).toBe(configured[0]);
  });

  it("puts the configured Ledger validators first", () => {
    const ledgerList = [validator("ledger-a"), validator("ledger-b")];
    const fetched = [validator("other"), validator("ledger-b"), validator("ledger-a")];

    expect(ledgerFirstValidators(fetched, ledgerList).map(v => v.voteAccount)).toEqual([
      "ledger-a",
      "ledger-b",
      "other",
    ]);
  });

  it("prepends the configured list when the backend misses one of them", () => {
    const ledgerList = [validator("ledger-a"), validator("ledger-b")];

    expect(ledgerFirstValidators([validator("other")], ledgerList).map(v => v.voteAccount)).toEqual(
      ["ledger-a", "ledger-b", "other"],
    );
  });
});

describe("utils - tuning values from the coin config", () => {
  it("falls back to the module defaults", () => {
    expect(feesOf(TEST_CONFIG)).toEqual({
      computeUnitMargin: 0.1,
      defaultTxFee: DEFAULT_TX_FEE,
      blockhashRetries: 5,
      blockhashRetryDelayMs: 5000,
    });
    expect(chainConfigFrom(TEST_CONFIG, "solana")).toEqual({
      endpoint: "https://solana.test.invalid",
      confirmationTimeoutMs: undefined,
      retries: undefined,
      retryDelayMs: undefined,
    });
  });

  it("reads the configured values", () => {
    const config = {
      ...TEST_CONFIG,
      broadcast: { timeoutMs: 1 },
      node: { retries: 2, retryDelayMs: 3 },
      fees: {
        computeUnitMargin: 0.2,
        defaultTxFee: 4,
        blockhashRetries: 5,
        blockhashRetryDelayMs: 6,
      },
    };

    expect(feesOf(config)).toEqual({
      computeUnitMargin: 0.2,
      defaultTxFee: 4,
      blockhashRetries: 5,
      blockhashRetryDelayMs: 6,
    });
    expect(chainConfigFrom(config, "solana")).toEqual({
      endpoint: "https://solana.test.invalid",
      confirmationTimeoutMs: 1,
      retries: 2,
      retryDelayMs: 3,
    });
  });
});
