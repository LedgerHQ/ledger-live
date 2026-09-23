import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
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
import type { CosmosAccount, CosmosUnbonding } from "./types";

const unit = getCryptoCurrencyById("cosmos").units[0];

const buildUnbonding = (validatorAddress: string, completionDate: string): CosmosUnbonding => ({
  validatorAddress,
  amount: new BigNumber(1000),
  completionDate: new Date(completionDate),
});

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

const makeAccount = (stakingResources: Partial<CosmosAccount["stakingResources"]>): CosmosAccount =>
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
  }) as unknown as CosmosAccount;

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
      completionDate: new Date(),
    }));
    const account = makeAccount({ redelegations });
    expect(canRedelegate(account, { validatorAddress: "validator-1" })).toBe(false);
  });

  it("returns false when the target validator already has a pending redelegation", () => {
    const account = makeAccount({
      redelegations: [
        {
          validatorSrcAddress: "validator-src",
          validatorDstAddress: "validator-1",
          amount: new BigNumber(1),
          completionDate: new Date(),
        },
      ],
    });
    expect(canRedelegate(account, { validatorAddress: "validator-1" })).toBe(false);
  });
});

describe("getRedelegation", () => {
  it("finds the redelegation targeting the given delegation's validator", () => {
    const redelegation = {
      validatorSrcAddress: "validator-src",
      validatorDstAddress: "validator-1",
      amount: new BigNumber(1),
      completionDate: new Date(),
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
});
