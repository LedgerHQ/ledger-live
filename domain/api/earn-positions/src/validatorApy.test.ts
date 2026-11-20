import { ApyFractionSchema } from "@domain/entity-earn-position";
import type { SolanaValidatorApyByVoteAccount } from "./types";
import { selectSolanaValidatorApy } from "./validatorApy";

const FIGMENT = "26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx";
const BITWISE = "CpfvLiiPALdzZTP3fUrALg2TXwEDSAknRh1sn5JCt9Sr";

const lookup: SolanaValidatorApyByVoteAccount = {
  [FIGMENT]: ApyFractionSchema.parse(0.078107),
};

describe("selectSolanaValidatorApy", () => {
  it("returns the APY of the validator", () => {
    expect(selectSolanaValidatorApy(lookup, FIGMENT)).toBe(0.078107);
  });

  it("returns undefined for a validator the lookup does not list", () => {
    expect(selectSolanaValidatorApy(lookup, BITWISE)).toBeUndefined();
  });

  it("returns undefined while the lookup is not loaded, or without a vote account", () => {
    expect(selectSolanaValidatorApy(undefined, FIGMENT)).toBeUndefined();
    expect(selectSolanaValidatorApy(lookup, undefined)).toBeUndefined();
    expect(selectSolanaValidatorApy(lookup, "")).toBeUndefined();
  });

  it("does not read the properties every object inherits", () => {
    expect(selectSolanaValidatorApy(lookup, "constructor")).toBeUndefined();
    expect(selectSolanaValidatorApy(lookup, "toString")).toBeUndefined();
  });
});
