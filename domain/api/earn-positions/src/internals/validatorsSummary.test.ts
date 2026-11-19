import {
  ValidatorsSummaryWireSchema,
  toSolanaValidatorApyByVoteAccount,
} from "./validatorsSummary";
import {
  LEDGER_BY_BITWISE_VOTE_ACCOUNT,
  LEDGER_BY_FIGMENT_VOTE_ACCOUNT,
  validatorsSummary,
} from "./wire.mock";

function read(payload: unknown) {
  return toSolanaValidatorApyByVoteAccount(ValidatorsSummaryWireSchema.parse(payload));
}

describe("toSolanaValidatorApyByVoteAccount", () => {
  it("keys the APY of each validator by its vote account", () => {
    expect(read(validatorsSummary())).toEqual({
      [LEDGER_BY_FIGMENT_VOTE_ACCOUNT]: 0.078107,
      [LEDGER_BY_BITWISE_VOTE_ACCOUNT]: 0.076512,
    });
  });

  it("drops an entry without a vote account, or with an APY that is not a fraction from 0 to 1", () => {
    const lookup = read([
      ...validatorsSummary(),
      { address: 42, delegator_apy: 0.05, name: "Number address" },
      { address: "", delegator_apy: 0.05, name: "Empty address" },
      { address: "VoteAccountPercent1111111111111111111111111", delegator_apy: 7.81 },
      { address: "VoteAccountString11111111111111111111111111", delegator_apy: "0.05" },
      { address: "VoteAccountNull111111111111111111111111111", delegator_apy: null },
      { address: "VoteAccountNegative1111111111111111111111111", delegator_apy: -0.01 },
      "not a validator",
    ]);

    expect(Object.keys(lookup)).toEqual([
      LEDGER_BY_FIGMENT_VOTE_ACCOUNT,
      LEDGER_BY_BITWISE_VOTE_ACCOUNT,
    ]);
  });

  it("reads an empty list as an empty lookup", () => {
    expect(read([])).toEqual({});
  });
});

describe("ValidatorsSummaryWireSchema", () => {
  it("rejects a payload that is not a list", () => {
    expect(ValidatorsSummaryWireSchema.safeParse({ data: validatorsSummary() }).success).toBe(
      false,
    );
  });
});
