import type { StakingValidatorItem } from "@ledgerhq/types-live";
import { getLedgerValidatorAddress, sortLedgerValidatorFirst } from "./ledgerValidator";

const makeValidator = (validatorAddress: string): StakingValidatorItem => ({
  validatorAddress,
  name: validatorAddress,
  commission: 0.05,
  tokens: "100",
  votingPower: 1,
  estimatedYearlyRewardsRate: 0,
});

const LEDGER_MONAD = "0xF249265D16A9D70F684b0E43863242298C25d81c";

describe("getLedgerValidatorAddress", () => {
  it("returns the Ledger validator address for monad", () => {
    expect(getLedgerValidatorAddress("monad")).toBe(LEDGER_MONAD.toLowerCase());
  });

  it("returns undefined for a chain without a mapped Ledger validator", () => {
    expect(getLedgerValidatorAddress("sei_evm")).toBeUndefined();
  });
});

describe("sortLedgerValidatorFirst", () => {
  it("moves the Ledger validator to the front, preserving the rest", () => {
    const validators = [makeValidator("0xA"), makeValidator(LEDGER_MONAD), makeValidator("0xB")];

    const result = sortLedgerValidatorFirst(validators, "monad");

    expect(result).toStrictEqual([
      makeValidator(LEDGER_MONAD),
      makeValidator("0xA"),
      makeValidator("0xB"),
    ]);
  });

  it("does not mutate the input array", () => {
    const validators = [makeValidator("0xA"), makeValidator(LEDGER_MONAD)];
    const snapshot = [...validators];

    sortLedgerValidatorFirst(validators, "monad");

    expect(validators).toStrictEqual(snapshot);
    expect(validators[0]).toBe(snapshot[0]);
  });

  it("returns the same array when the Ledger validator is absent", () => {
    const validators = [makeValidator("0xA"), makeValidator("0xB")];

    expect(sortLedgerValidatorFirst(validators, "monad")).toBe(validators);
  });

  it("is a no-op for a chain without a mapped Ledger validator", () => {
    const validators = [makeValidator(LEDGER_MONAD), makeValidator("0xA")];

    expect(sortLedgerValidatorFirst(validators, "sei_evm")).toBe(validators);
  });
});
