import {
  LEDGER_VALIDATOR_BY_FIGMENT,
  LEDGER_VALIDATOR_BY_CHORUS_ONE,
  LEDGER_VALIDATOR_DEFAULT,
} from "../../utils";

describe("utils - Default Validators", () => {
  it("should have APY property", () => {
    expect(LEDGER_VALIDATOR_BY_FIGMENT).toMatchObject({ apy: expect.any(Number) });
    expect(LEDGER_VALIDATOR_BY_CHORUS_ONE).toMatchObject({ apy: expect.any(Number) });
  });
  it("should have different APY values", () => {
    expect(LEDGER_VALIDATOR_BY_FIGMENT.apy).not.toBe(LEDGER_VALIDATOR_BY_CHORUS_ONE.apy);
  });

  it("should reference correct default", () => {
    expect(LEDGER_VALIDATOR_DEFAULT).toBe(LEDGER_VALIDATOR_BY_FIGMENT);
  });
});
