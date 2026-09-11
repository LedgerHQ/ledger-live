import { BigNumber } from "bignumber.js";
import { useNearBalanceBreakdown } from "./react";
import type { NearAccount } from "@ledgerhq/coin-near/types";

// useNearBalanceBreakdown reads account fields without any React state,
// so it can be called directly as a pure function in tests.

type FrameworkAccount = {
  stakingPositions?: Array<{ state: string; delegate?: string; amount: BigNumber }>;
};

function makeAccount(
  balance: string,
  spendableBalance: string,
  positions: FrameworkAccount["stakingPositions"] = [],
): NearAccount {
  return {
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(spendableBalance),
    stakingPositions: positions,
  } as unknown as NearAccount;
}

describe("useNearBalanceBreakdown", () => {
  it("returns all zeros when there are no staking positions", () => {
    const account = makeAccount("1000", "1000");
    const result = useNearBalanceBreakdown(account);
    expect(result.stakedBalance.toFixed()).toBe("0");
    expect(result.pendingBalance.toFixed()).toBe("0");
    expect(result.availableBalance.toFixed()).toBe("0");
    expect(result.storageUsageBalance.toFixed()).toBe("0");
  });

  it("sums active positions into stakedBalance", () => {
    const account = makeAccount("1000", "600", [
      { state: "active", delegate: "validator.near", amount: new BigNumber("300") },
      { state: "active", delegate: "other.near", amount: new BigNumber("100") },
    ]);
    const result = useNearBalanceBreakdown(account);
    expect(result.stakedBalance.toFixed()).toBe("400");
  });

  it("sums deactivating positions into pendingBalance", () => {
    const account = makeAccount("1000", "700", [
      { state: "deactivating", delegate: "validator.near", amount: new BigNumber("200") },
      { state: "deactivating", delegate: "other.near", amount: new BigNumber("50") },
    ]);
    const result = useNearBalanceBreakdown(account);
    expect(result.pendingBalance.toFixed()).toBe("250");
  });

  it("sums withdrawable positions into availableBalance", () => {
    const account = makeAccount("1000", "800", [
      { state: "withdrawable", delegate: "validator.near", amount: new BigNumber("150") },
    ]);
    const result = useNearBalanceBreakdown(account);
    expect(result.availableBalance.toFixed()).toBe("150");
  });

  it("computes storageUsageBalance as locked minus all staking buckets", () => {
    // locked = 1000 - 400 = 600
    // staked=200, pending=100, available=50 → nonStorageLocked=350
    // storage = 600 - 350 = 250
    const account = makeAccount("1000", "400", [
      { state: "active", delegate: "v.near", amount: new BigNumber("200") },
      { state: "deactivating", delegate: "v.near", amount: new BigNumber("100") },
      { state: "withdrawable", delegate: "v.near", amount: new BigNumber("50") },
    ]);
    const result = useNearBalanceBreakdown(account);
    expect(result.stakedBalance.toFixed()).toBe("200");
    expect(result.pendingBalance.toFixed()).toBe("100");
    expect(result.availableBalance.toFixed()).toBe("50");
    expect(result.storageUsageBalance.toFixed()).toBe("250");
  });

  it("clamps storageUsageBalance to 0 when staking exceeds locked (should not happen on-chain but guards against bad data)", () => {
    // locked = 100 - 50 = 50, staked = 200 → would be negative, clamp to 0
    const account = makeAccount("100", "50", [
      { state: "active", delegate: "v.near", amount: new BigNumber("200") },
    ]);
    const result = useNearBalanceBreakdown(account);
    expect(result.storageUsageBalance.toFixed()).toBe("0");
  });

  it("falls back gracefully when account has no stakingPositions field", () => {
    const account = makeAccount("500", "500");
    const result = useNearBalanceBreakdown(account);
    expect(result.stakedBalance.toFixed()).toBe("0");
    expect(result.storageUsageBalance.toFixed()).toBe("0");
  });
});
