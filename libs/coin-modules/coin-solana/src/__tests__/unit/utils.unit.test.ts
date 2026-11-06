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
  feesOf,
  ledgerFirstValidators,
  ledgerValidatorsOf,
} from "../../utils";

describe("utils - chainConfigFrom", () => {
  it("uses the rpcUrl of the coin config as endpoint", () => {
    const config = { ...TEST_CONFIG, rpcUrl: "https://custom-devnet.example.com" };

    expect(chainConfigFrom(config).endpoint).toBe("https://custom-devnet.example.com");
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
    expect(chainConfigFrom(TEST_CONFIG)).toEqual({
      endpoint: "https://solana.test.invalid",
      confirmationTimeoutMs: undefined,
      retries: undefined,
      retryDelayMs: undefined,
    });
    expect(chainConfigFrom(TEST_CONFIG)).not.toHaveProperty("minPriorityFee");
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
        minPriorityFee: 7,
      },
    };

    expect(feesOf(config)).toEqual({
      computeUnitMargin: 0.2,
      defaultTxFee: 4,
      blockhashRetries: 5,
      blockhashRetryDelayMs: 6,
    });
    expect(chainConfigFrom(config)).toEqual({
      endpoint: "https://solana.test.invalid",
      confirmationTimeoutMs: 1,
      retries: 2,
      retryDelayMs: 3,
      minPriorityFee: 7,
    });
  });
});
