import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { StakingDelegation, StakingRedelegation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import {
  canDelegate,
  canRedelegate,
  canUndelegate,
  COSMOS_MAX_DELEGATIONS,
  COSMOS_MAX_REDELEGATIONS,
  COSMOS_MAX_UNBONDINGS,
  COSMOS_MIN_FEES,
  COSMOS_MIN_SAFE,
  formatValue,
  getCosmosDummyRecipient,
  getMaxDelegationAvailable,
  getMaxEstimatedBalance,
  getRedelegation,
  getRedelegationCompletionDate,
  isCompoundRewardSupported,
  mapDelegationInfo,
  mapDelegations,
  mapRedelegations,
  mapUnbondings,
  parseAmountStringToNumber,
  resolveClaimRewardMode,
  searchFilter,
} from "./logic";
import type { Account, StakingAccount } from "@ledgerhq/types-live";
import type {
  CosmosDelegationInfo,
  CosmosMappedDelegation,
  CosmosUnbonding,
  CosmosValidatorItem,
  Transaction,
} from "./types";

const unit = getCryptoCurrencyById("cosmos").units[0];

const buildUnbonding = (validatorAddress: string, completionDate: string): CosmosUnbonding => ({
  validatorAddress,
  amount: new BigNumber(1000),
  completionDate: new Date(completionDate),
});

const makeAccount = (
  stakingResources: Partial<StakingAccount["stakingResources"]>,
): StakingAccount =>
  ({
    stakingResources: {
      delegations: [],
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
      ...stakingResources,
    },
  }) as unknown as StakingAccount;

const amountFormatOptions = { disableRounding: true, alwaysShowSign: false, showCode: true };

describe("mapUnbondings", () => {
  it("should not throw when unbondings input is frozen", () => {
    const unbondings = [
      buildUnbonding("validator-2", "2024-01-02T00:00:00.000Z"),
      buildUnbonding("validator-1", "2024-01-01T00:00:00.000Z"),
    ];
    Object.freeze(unbondings);

    expect(() => mapUnbondings(unbondings, [], unit)).not.toThrow();
  });

  it("should not mutate the original unbondings order", () => {
    const unbondings = [
      buildUnbonding("validator-2", "2024-01-02T00:00:00.000Z"),
      buildUnbonding("validator-1", "2024-01-01T00:00:00.000Z"),
    ];

    const result = mapUnbondings(unbondings, [], unit);

    expect(unbondings.map(({ validatorAddress }) => validatorAddress)).toEqual([
      "validator-2",
      "validator-1",
    ]);
    expect(result.map(({ validatorAddress }) => validatorAddress)).toEqual([
      "validator-1",
      "validator-2",
    ]);
  });

  it("resolves the matching validator for each unbonding, and formats the amount", () => {
    const unbonding = buildUnbonding("validator-1", "2024-01-01T00:00:00.000Z");
    const validators = [
      { validatorAddress: "validator-1", name: "Validator One" } as CosmosValidatorItem,
    ];

    const [result] = mapUnbondings([unbonding], validators, unit);

    expect(result.validator).toBe(validators[0]);
    expect(result.formattedAmount).toBe(
      formatCurrencyUnit(unit, unbonding.amount, amountFormatOptions),
    );
  });
});

describe("isCompoundRewardSupported", () => {
  it("returns true for standard (non-epoching) cosmos chains", () => {
    expect(isCompoundRewardSupported("cosmos")).toBe(true);
  });

  it("returns false for epoching chains whose staking messages are wrapped (babylon)", () => {
    expect(isCompoundRewardSupported("babylon")).toBe(false);
  });

  it("does not throw for currencies that reuse another chain's params (crypto_org_croeseid)", () => {
    expect(() => isCompoundRewardSupported("crypto_org_croeseid")).not.toThrow();
    expect(isCompoundRewardSupported("crypto_org_croeseid")).toBe(
      isCompoundRewardSupported("crypto_org"),
    );
  });
});

describe("resolveClaimRewardMode", () => {
  it("keeps claimRewardCompound on chains that support it (cosmos)", () => {
    expect(resolveClaimRewardMode("cosmos", "claimRewardCompound")).toBe("claimRewardCompound");
  });

  it("downgrades claimRewardCompound to claimReward on epoching chains (babylon)", () => {
    expect(resolveClaimRewardMode("babylon", "claimRewardCompound")).toBe("claimReward");
  });

  it("keeps compoundReward on chains that support it (cosmos)", () => {
    expect(resolveClaimRewardMode("cosmos", "compoundReward")).toBe("compoundReward");
  });

  it("downgrades compoundReward to claimReward on epoching chains (babylon)", () => {
    expect(resolveClaimRewardMode("babylon", "compoundReward")).toBe("claimReward");
  });

  it("leaves non-compound modes untouched", () => {
    expect(resolveClaimRewardMode("babylon", "claimReward")).toBe("claimReward");
    expect(resolveClaimRewardMode("babylon", "delegate")).toBe("delegate");
  });
});

describe("getCosmosDummyRecipient", () => {
  it("returns a bech32 address with the chain prefix", () => {
    expect(getCosmosDummyRecipient("cosmos")).toMatch(/^cosmos1/);
  });

  it("reuses crypto_org's params for the croeseid testnet", () => {
    expect(getCosmosDummyRecipient("crypto_org_croeseid")).toBe(
      getCosmosDummyRecipient("crypto_org"),
    );
  });
});

describe("canRedelegate", () => {
  it("returns true when below the max and no pending redelegation targets this validator", () => {
    const account = makeAccount({ redelegations: [] });
    expect(canRedelegate(account, { validatorAddress: "validator-1" })).toBe(true);
  });

  it("returns false when the account already has the maximum number of redelegations", () => {
    const redelegations = Array.from({ length: COSMOS_MAX_REDELEGATIONS }).map((_, i) => ({
      validatorSrcAddress: "validator-src",
      validatorDstAddress: `validator-dst-${i}`,
      amount: new BigNumber(1),
      completionDate: new Date(Date.now() + 60_000),
    }));
    const account = makeAccount({ redelegations });
    expect(canRedelegate(account, { validatorAddress: "validator-1" })).toBe(false);
  });

  it("ignores already-completed redelegations when checking the maximum", () => {
    const redelegations = Array.from({ length: COSMOS_MAX_REDELEGATIONS }).map((_, i) => ({
      validatorSrcAddress: "validator-src",
      validatorDstAddress: `validator-dst-${i}`,
      amount: new BigNumber(1),
      completionDate: new Date(Date.now() - 60_000),
    }));
    const account = makeAccount({ redelegations });
    expect(canRedelegate(account, { validatorAddress: "validator-1" })).toBe(true);
  });

  it("returns false when the target validator already has a pending redelegation", () => {
    const account = makeAccount({
      redelegations: [
        {
          validatorSrcAddress: "validator-src",
          validatorDstAddress: "validator-1",
          amount: new BigNumber(1),
          completionDate: new Date(Date.now() + 60_000),
        },
      ],
    });
    expect(canRedelegate(account, { validatorAddress: "validator-1" })).toBe(false);
  });

  it("returns true when the only redelegation to that validator has already completed", () => {
    const account = makeAccount({
      redelegations: [
        {
          validatorSrcAddress: "validator-src",
          validatorDstAddress: "validator-1",
          amount: new BigNumber(1),
          completionDate: new Date(Date.now() - 60_000),
        },
      ],
    });
    expect(canRedelegate(account, { validatorAddress: "validator-1" })).toBe(true);
  });
});

describe("getRedelegation", () => {
  it("finds the redelegation targeting the given delegation's validator", () => {
    const redelegation = {
      validatorSrcAddress: "validator-src",
      validatorDstAddress: "validator-1",
      amount: new BigNumber(1),
      completionDate: new Date(Date.now() + 60_000),
    };
    const account = makeAccount({ redelegations: [redelegation] });
    expect(getRedelegation(account, { validatorAddress: "validator-1" } as never)).toEqual(
      redelegation,
    );
  });

  it("returns undefined when there is no matching redelegation", () => {
    const account = makeAccount({ redelegations: [] });
    expect(getRedelegation(account, { validatorAddress: "validator-1" } as never)).toBeUndefined();
  });

  it("ignores a redelegation to that validator that has already completed", () => {
    const redelegation = {
      validatorSrcAddress: "validator-src",
      validatorDstAddress: "validator-1",
      amount: new BigNumber(1),
      completionDate: new Date(Date.now() - 60_000),
    };
    const account = makeAccount({ redelegations: [redelegation] });
    expect(getRedelegation(account, { validatorAddress: "validator-1" } as never)).toBeUndefined();
  });
});

describe("canUndelegate", () => {
  it("returns true when unbondings are below the max", () => {
    const account = makeAccount({ unbondings: [] });
    expect(canUndelegate(account)).toBe(true);
  });

  it("returns false once unbondings reach COSMOS_MAX_UNBONDINGS", () => {
    const unbondings = Array.from({ length: COSMOS_MAX_UNBONDINGS }).map((_, i) => ({
      validatorAddress: `validator-${i}`,
      amount: new BigNumber(1),
      completionDate: new Date(),
    }));
    const account = makeAccount({ unbondings });
    expect(canUndelegate(account)).toBe(false);
  });
});

describe("mapDelegations", () => {
  it("resolves the matching validator and its rank, and formats both amounts", () => {
    const delegation: StakingDelegation = {
      validatorAddress: "cosmosvaloper1two",
      amount: new BigNumber(2_000_000),
      pendingRewards: new BigNumber(500_000),
      status: "bonded",
    };
    const validators = [
      { validatorAddress: "cosmosvaloper1one" } as CosmosValidatorItem,
      { validatorAddress: "cosmosvaloper1two", name: "Validator Two" } as CosmosValidatorItem,
    ];

    const [result] = mapDelegations([delegation], validators, unit);

    expect(result.rank).toBe(1);
    expect(result.validator).toBe(validators[1]);
    expect(result.formattedAmount).toBe(
      formatCurrencyUnit(unit, delegation.amount, {
        disableRounding: false,
        alwaysShowSign: false,
        showCode: true,
      }),
    );
    expect(result.formattedPendingRewards).toBe(
      formatCurrencyUnit(unit, delegation.pendingRewards, {
        disableRounding: false,
        alwaysShowSign: false,
        showCode: true,
      }),
    );
  });

  it("falls back to the delegation itself when no validator matches", () => {
    const delegation: StakingDelegation = {
      validatorAddress: "cosmosvaloper1unknown",
      amount: new BigNumber(1_000_000),
      pendingRewards: new BigNumber(0),
      status: "bonded",
    };

    const [result] = mapDelegations([delegation], [], unit);

    expect(result.rank).toBe(-1);
    expect(result.validator).toBe(delegation);
  });
});

describe("mapRedelegations", () => {
  it("resolves the source and destination validators independently", () => {
    const redelegation: StakingRedelegation = {
      validatorSrcAddress: "cosmosvaloper1src",
      validatorDstAddress: "cosmosvaloper1dst",
      amount: new BigNumber(1_000_000),
      completionDate: new Date("2030-01-01T00:00:00.000Z"),
    };
    const validators = [{ validatorAddress: "cosmosvaloper1src" } as CosmosValidatorItem];

    const [result] = mapRedelegations([redelegation], validators, unit);

    expect(result.validatorSrc).toBe(validators[0]);
    expect(result.validatorDst).toBeUndefined();
    expect(result.formattedAmount).toBe(
      formatCurrencyUnit(unit, redelegation.amount, amountFormatOptions),
    );
  });
});

describe("mapDelegationInfo", () => {
  const delegationInfo: CosmosDelegationInfo = {
    address: "cosmosvaloper1one",
    amount: new BigNumber(3_000_000),
  };
  const validators = [{ validatorAddress: "cosmosvaloper1one" } as CosmosValidatorItem];

  it("formats the delegation's own amount when no transaction is given", () => {
    const [result] = mapDelegationInfo([delegationInfo], validators, unit);

    expect(result.validator).toBe(validators[0]);
    expect(result.formattedAmount).toBe(
      formatCurrencyUnit(unit, delegationInfo.amount, amountFormatOptions),
    );
  });

  it("formats the pending transaction's amount instead, when one is given", () => {
    const transaction = { amount: new BigNumber(9_000_000) } as unknown as Transaction;

    const [result] = mapDelegationInfo([delegationInfo], validators, unit, transaction);

    expect(result.formattedAmount).toBe(
      formatCurrencyUnit(unit, transaction.amount, amountFormatOptions),
    );
  });
});

describe("formatValue", () => {
  it("divides by the unit's magnitude", () => {
    expect(formatValue(new BigNumber(2_000_000), unit)).toBe(2);
  });

  it("floors instead of rounding to the nearest unit", () => {
    expect(formatValue(new BigNumber(2_999_999), unit)).toBe(2);
  });
});

describe("searchFilter", () => {
  const item = {
    validator: { name: "Cosmos Validator", validatorAddress: "cosmosvaloper1abc" },
  } as unknown as CosmosMappedDelegation;

  it("matches by validator name, case-insensitively and trimmed", () => {
    expect(searchFilter(" cosmos ")(item)).toBe(true);
  });

  it("matches by validator address", () => {
    expect(searchFilter("cosmosvaloper1abc")(item)).toBe(true);
  });

  it("returns false when neither the name nor the address match", () => {
    expect(searchFilter("unknown")(item)).toBe(false);
  });

  it("does not throw when the item has no validator", () => {
    const validatorless = {} as unknown as CosmosMappedDelegation;

    expect(searchFilter("anything")(validatorless)).toBe(false);
  });
});

describe("getMaxDelegationAvailable", () => {
  it("subtracts fees scaled by the validator count and the min-safe buffer", () => {
    const account = { spendableBalance: new BigNumber(10_000_000) } as StakingAccount;

    const result = getMaxDelegationAvailable(account, 3);

    expect(
      result.isEqualTo(
        new BigNumber(10_000_000).minus(COSMOS_MIN_FEES.multipliedBy(3)).minus(COSMOS_MIN_SAFE),
      ),
    ).toBe(true);
  });

  it("caps the fee scaling at COSMOS_MAX_DELEGATIONS even with more validators", () => {
    const account = { spendableBalance: new BigNumber(10_000_000) } as StakingAccount;

    const result = getMaxDelegationAvailable(account, 100);

    expect(
      result.isEqualTo(
        new BigNumber(10_000_000)
          .minus(COSMOS_MIN_FEES.multipliedBy(COSMOS_MAX_DELEGATIONS))
          .minus(COSMOS_MIN_SAFE),
      ),
    ).toBe(true);
  });

  it("treats a validator count of 0 as 1", () => {
    const account = { spendableBalance: new BigNumber(1_000_000) } as StakingAccount;

    const result = getMaxDelegationAvailable(account, 0);

    expect(
      result.isEqualTo(new BigNumber(1_000_000).minus(COSMOS_MIN_FEES).minus(COSMOS_MIN_SAFE)),
    ).toBe(true);
  });
});

describe("getMaxEstimatedBalance", () => {
  it("subtracts fees and the locked (unbonding + delegated) balance", () => {
    const account = {
      balance: new BigNumber(10_000_000),
      stakingResources: {
        unbondingBalance: new BigNumber(2_000_000),
        delegatedBalance: new BigNumber(3_000_000),
      },
    } as StakingAccount;

    const result = getMaxEstimatedBalance(account, new BigNumber(1_000_000));

    expect(result.isEqualTo(new BigNumber(4_000_000))).toBe(true);
  });

  it("clamps a negative result to 0", () => {
    const account = {
      balance: new BigNumber(1_000_000),
      stakingResources: {
        unbondingBalance: new BigNumber(0),
        delegatedBalance: new BigNumber(0),
      },
    } as StakingAccount;

    const result = getMaxEstimatedBalance(account, new BigNumber(5_000_000));

    expect(result.isEqualTo(new BigNumber(0))).toBe(true);
  });
});

describe("canDelegate", () => {
  it("returns true when the spendable balance covers fees and the min-safe buffer", () => {
    const account = { spendableBalance: new BigNumber(200_000) } as StakingAccount;
    expect(canDelegate(account)).toBe(true);
  });

  it("returns false when the spendable balance does not cover fees and the min-safe buffer", () => {
    const account = { spendableBalance: new BigNumber(100_000) } as StakingAccount;
    expect(canDelegate(account)).toBe(false);
  });
});

describe("getRedelegationCompletionDate", () => {
  it("returns the matching redelegation's completion date", () => {
    const completionDate = new Date("2030-01-01T00:00:00.000Z");
    const account = makeAccount({
      redelegations: [
        {
          validatorSrcAddress: "validator-src",
          validatorDstAddress: "validator-1",
          amount: new BigNumber(1),
          completionDate,
        },
      ],
    });

    expect(
      getRedelegationCompletionDate(account, { validatorAddress: "validator-1" } as never),
    ).toEqual(completionDate);
  });

  it("returns null when there is no matching redelegation", () => {
    const account = makeAccount({ redelegations: [] });

    expect(
      getRedelegationCompletionDate(account, { validatorAddress: "validator-1" } as never),
    ).toBeNull();
  });
});

describe("parseAmountStringToNumber", () => {
  it("keeps only what follows the last comma, stripping the unit code", () => {
    expect(parseAmountStringToNumber("1.234,56 ATOM", "ATOM")).toBe("56 ");
  });

  it("returns the whole string (unit code stripped) when there is no comma", () => {
    expect(parseAmountStringToNumber("42 ATOM", "ATOM")).toBe("42 ");
  });
});

describe("staking guard", () => {
  const notStaking = { balance: new BigNumber(0) } as unknown as Account;

  it.each([
    ["getMaxEstimatedBalance", () => getMaxEstimatedBalance(notStaking, new BigNumber(0))],
    ["canUndelegate", () => canUndelegate(notStaking)],
    ["canRedelegate", () => canRedelegate(notStaking, { validatorAddress: "v" })],
    ["getRedelegation", () => getRedelegation(notStaking, { validatorAddress: "v" } as never)],
  ])("%s throws for an account without staking resources", (_name, call) => {
    expect(call).toThrow("cosmos staking account required");
  });
});
