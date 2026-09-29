import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { Account, StakingResources } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import {
  canRedelegate,
  canUndelegate,
  COSMOS_MAX_REDELEGATIONS,
  COSMOS_MAX_UNBONDINGS,
  getCosmosDummyRecipient,
  getRedelegation,
  isCompoundRewardSupported,
  mapUnbondings,
  resolveClaimRewardMode,
} from "./logic";
import type {
  CosmosMappedDelegation,
  CosmosResources,
  CosmosUnbonding,
  CosmosValidatorItem,
} from "./types";

const unit = getCryptoCurrencyById("cosmos").units[0];

const buildUnbonding = (validatorAddress: string, completionDate: string): CosmosUnbonding => ({
  validatorAddress,
  amount: new BigNumber(1000),
  completionDate: new Date(completionDate),
});

const emptyResources = {
  delegations: [],
  redelegations: [],
  unbondings: [],
  delegatedBalance: new BigNumber(0),
  pendingRewardsBalance: new BigNumber(0),
  unbondingBalance: new BigNumber(0),
};

const buildAccounts = (resources: StakingResources) => {
  const baseAccount = {
    currency: getCryptoCurrencyById("cosmos"),
    spendableBalance: new BigNumber(1_000_000),
  };
  const genericAccount = { ...baseAccount, stakingResources: resources } as unknown as Account;
  const legacyAccount = {
    ...baseAccount,
    cosmosResources: resources as CosmosResources,
  } as unknown as Account;
  return { genericAccount, legacyAccount };
};

const validator = {
  validatorAddress: "cosmosvaloper1source",
} as CosmosValidatorItem;

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

describe("staking action predicates", () => {
  it("keeps the generic unbonding-limit verdict in parity with the legacy account", () => {
    const resources = {
      ...emptyResources,
      unbondings: Array.from({ length: COSMOS_MAX_UNBONDINGS }, (_, index) =>
        buildUnbonding(`cosmosvaloper${index}`, "2999-01-01T00:00:00.000Z"),
      ),
    };
    const { genericAccount, legacyAccount } = buildAccounts(resources);

    expect(canUndelegate(genericAccount)).toBe(canUndelegate(legacyAccount));
    expect(canUndelegate(genericAccount)).toBe(false);
  });

  it("keeps the generic active-redelegation-limit verdict in parity with the legacy account", () => {
    const resources = {
      ...emptyResources,
      redelegations: Array.from({ length: COSMOS_MAX_REDELEGATIONS }, (_, index) => ({
        validatorSrcAddress: `cosmosvaloper1src${index}`,
        validatorDstAddress: `cosmosvaloper1dst${index}`,
        amount: new BigNumber(1000),
        completionDate: new Date("2999-01-01T00:00:00.000Z"),
      })),
    };
    const { genericAccount, legacyAccount } = buildAccounts(resources);

    expect(canRedelegate(genericAccount, validator)).toBe(canRedelegate(legacyAccount, validator));
    expect(canRedelegate(genericAccount, validator)).toBe(false);
  });

  it("keeps the generic in-progress verdict in parity with the legacy account", () => {
    const resources = {
      ...emptyResources,
      redelegations: [
        {
          validatorSrcAddress: "cosmosvaloper1origin",
          validatorDstAddress: validator.validatorAddress,
          amount: new BigNumber(1000),
          completionDate: new Date("2999-01-01T00:00:00.000Z"),
        },
      ],
    };
    const { genericAccount, legacyAccount } = buildAccounts(resources);

    expect(canRedelegate(genericAccount, validator)).toBe(canRedelegate(legacyAccount, validator));
    expect(canRedelegate(genericAccount, validator)).toBe(false);
  });

  it("ignores expired redelegations for both the limit and in-progress checks", () => {
    const resources = {
      ...emptyResources,
      redelegations: Array.from({ length: COSMOS_MAX_REDELEGATIONS }, (_, index) => ({
        validatorSrcAddress: `cosmosvaloper1src${index}`,
        validatorDstAddress: index === 0 ? validator.validatorAddress : `cosmosvaloper1dst${index}`,
        amount: new BigNumber(1000),
        completionDate: new Date("2000-01-01T00:00:00.000Z"),
      })),
    };
    const { genericAccount, legacyAccount } = buildAccounts(resources);

    expect(canRedelegate(genericAccount, validator)).toBe(canRedelegate(legacyAccount, validator));
    expect(canRedelegate(genericAccount, validator)).toBe(true);
  });

  it("does not return an expired redelegation", () => {
    const resources = {
      ...emptyResources,
      redelegations: [
        {
          validatorSrcAddress: "cosmosvaloper1origin",
          validatorDstAddress: validator.validatorAddress,
          amount: new BigNumber(1000),
          completionDate: new Date("2000-01-01T00:00:00.000Z"),
        },
      ],
    };
    const { genericAccount } = buildAccounts(resources);

    expect(
      getRedelegation(genericAccount, validator as unknown as CosmosMappedDelegation),
    ).toBeUndefined();
  });
});
