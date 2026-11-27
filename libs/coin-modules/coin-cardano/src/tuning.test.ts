import type { CardanoCoinConfig } from "./config";
import { CardanoInvalidConfigError } from "./errors";
import { cardanoCoinConfig } from "./fixtures/config";
import {
  getFeeTooHighRatio,
  getLedgerValidators,
  getMaxFees,
  getValidatorsBatchSize,
  LEDGER_VALIDATORS,
} from "./tuning";

const withConfig = (overrides: Partial<CardanoCoinConfig>): CardanoCoinConfig => ({
  ...cardanoCoinConfig,
  ...overrides,
});

describe("getMaxFees", () => {
  it("reads both thresholds", () => {
    expect(getMaxFees(withConfig({ maxFeesWarning: 5e6, maxFeesError: 10e6 }))).toEqual({
      warning: 5e6,
      error: 10e6,
    });
  });

  it("keeps an explicit zero", () => {
    expect(getMaxFees(withConfig({ maxFeesWarning: 0, maxFeesError: 0 }))).toEqual({
      warning: 0,
      error: 0,
    });
  });

  it("rejects a warning above the error threshold", () => {
    expect(() => getMaxFees(withConfig({ maxFeesWarning: 8e6, maxFeesError: 6e6 }))).toThrow(
      CardanoInvalidConfigError,
    );
  });

  it.each([undefined, -1, 1.5, Number.NaN, "5000000"])("rejects %p", value => {
    const config = withConfig({ maxFeesWarning: 0, maxFeesError: value as number });
    expect(() => getMaxFees(config)).toThrow(CardanoInvalidConfigError);
  });
});

describe("getFeeTooHighRatio", () => {
  it("reads the configured ratio", () => {
    expect(getFeeTooHighRatio(withConfig({ fees: { tooHighRatio: 4 } }))).toBe(4n);
  });

  it.each([undefined, 0, 2.5])("rejects %p", tooHighRatio => {
    const config = withConfig({ fees: { tooHighRatio: tooHighRatio as number } });
    expect(() => getFeeTooHighRatio(config)).toThrow(CardanoInvalidConfigError);
  });
});

describe("getValidatorsBatchSize", () => {
  it("reads the configured batch size", () => {
    expect(getValidatorsBatchSize(withConfig({ validators: { batchSize: 25 } }))).toBe(25);
  });

  it.each([undefined, 0, 2.5])("rejects %p", batchSize => {
    const config = withConfig({ validators: { batchSize: batchSize as number } });
    expect(() => getValidatorsBatchSize(config)).toThrow(CardanoInvalidConfigError);
  });
});

describe("getLedgerValidators", () => {
  it("reads the configured pool ids", () => {
    expect(getLedgerValidators(withConfig({ staking: { ledgerValidators: ["pool"] } }))).toEqual([
      "pool",
    ]);
  });

  it("answers the Ledger pools when none are configured", () => {
    expect(getLedgerValidators(withConfig({}))).toBe(LEDGER_VALIDATORS);
    expect(getLedgerValidators(withConfig({ staking: {} }))).toBe(LEDGER_VALIDATORS);
  });

  it.each([null, "pool", [1], [""], []])("rejects %p", ledgerValidators => {
    const config = withConfig({ staking: { ledgerValidators: ledgerValidators as string[] } });
    expect(() => getLedgerValidators(config)).toThrow(CardanoInvalidConfigError);
  });
});
