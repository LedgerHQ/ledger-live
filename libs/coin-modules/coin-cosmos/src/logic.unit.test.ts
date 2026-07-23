import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import BigNumber from "bignumber.js";
import {
  getCosmosDummyRecipient,
  isCompoundRewardSupported,
  mapUnbondings,
  resolveClaimRewardMode,
} from "./logic";
import type { CosmosUnbonding } from "./types";

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
