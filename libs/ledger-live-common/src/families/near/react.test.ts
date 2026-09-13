/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import { BigNumber } from "bignumber.js";
import { renderHook, waitFor } from "@testing-library/react";
import {
  getNearBalanceBreakdown,
  useNearMappedStakingPositions,
  useNearStakingPositionsQuerySelector,
  useLedgerFirstShuffledValidatorsNear,
} from "./react";
import type { NearAccount, Transaction } from "@ledgerhq/coin-near/types";
import { FIGMENT_NEAR_VALIDATOR_ADDRESS } from "@ledgerhq/coin-near/constants";

const mockGetValidators = jest.fn();

jest.mock("../../bridge/generic-coin-framework/api", () => ({
  getCoinModuleApi: () => Promise.resolve({ getValidators: mockGetValidators }),
}));

jest.mock("../../config", () => ({
  getCurrencyConfiguration: () => ({}),
}));

jest.mock("../../account", () => ({
  getAccountCurrency: () => ({ units: [{ code: "NEAR", name: "NEAR", magnitude: 24 }] }),
}));

// getNearBalanceBreakdown reads account fields without any React state,
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

describe("getNearBalanceBreakdown", () => {
  it("returns all zeros when there are no staking positions", () => {
    const account = makeAccount("1000", "1000");
    const result = getNearBalanceBreakdown(account);
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
    const result = getNearBalanceBreakdown(account);
    expect(result.stakedBalance.toFixed()).toBe("400");
  });

  it("sums deactivating positions into pendingBalance", () => {
    const account = makeAccount("1000", "700", [
      { state: "deactivating", delegate: "validator.near", amount: new BigNumber("200") },
      { state: "deactivating", delegate: "other.near", amount: new BigNumber("50") },
    ]);
    const result = getNearBalanceBreakdown(account);
    expect(result.pendingBalance.toFixed()).toBe("250");
  });

  it("sums withdrawable positions into availableBalance", () => {
    const account = makeAccount("1000", "800", [
      { state: "withdrawable", delegate: "validator.near", amount: new BigNumber("150") },
    ]);
    const result = getNearBalanceBreakdown(account);
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
    const result = getNearBalanceBreakdown(account);
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
    const result = getNearBalanceBreakdown(account);
    expect(result.storageUsageBalance.toFixed()).toBe("0");
  });

  it("reads the legacy nearResources aggregates while the routing flag is still off", () => {
    const account = {
      balance: new BigNumber("1000"),
      spendableBalance: new BigNumber("400"),
      nearResources: {
        stakedBalance: new BigNumber("200"),
        pendingBalance: new BigNumber("100"),
        availableBalance: new BigNumber("50"),
        storageUsageBalance: new BigNumber("250"),
      },
    } as unknown as NearAccount;

    const result = getNearBalanceBreakdown(account);

    expect(result.stakedBalance.toFixed()).toBe("200");
    expect(result.pendingBalance.toFixed()).toBe("100");
    expect(result.availableBalance.toFixed()).toBe("50");
    expect(result.storageUsageBalance.toFixed()).toBe("250");
  });

  it("prefers framework positions over the legacy aggregates when both are present", () => {
    const account = {
      balance: new BigNumber("1000"),
      spendableBalance: new BigNumber("400"),
      nearResources: {
        stakedBalance: new BigNumber("1"),
        pendingBalance: new BigNumber("1"),
        availableBalance: new BigNumber("1"),
        storageUsageBalance: new BigNumber("1"),
      },
      stakingPositions: [{ state: "active", delegate: "v.near", amount: new BigNumber("200") }],
    } as unknown as NearAccount;

    expect(getNearBalanceBreakdown(account).stakedBalance.toFixed()).toBe("200");
  });

  it("falls back gracefully when account has no stakingPositions field", () => {
    const account = makeAccount("500", "500");
    const result = getNearBalanceBreakdown(account);
    expect(result.stakedBalance.toFixed()).toBe("0");
    expect(result.storageUsageBalance.toFixed()).toBe("0");
  });
});

const validatorPage = (
  items: Array<{ address: string; balance: bigint; commissionRate?: string }>,
) => ({ items, next: undefined });

// The validator fetch resolves on a later tick; settle it inside the test so the resulting
// state update is not reported as an un-acted-on React update after the test has finished.
const settleValidatorFetch = () => waitFor(() => expect(mockGetValidators).toHaveBeenCalled());

describe("useNearMappedStakingPositions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetValidators.mockResolvedValue(validatorPage([]));
  });

  it("groups framework positions by delegate and sums each state bucket", async () => {
    const account = makeAccount("1000", "400", [
      { state: "active", delegate: "a.near", amount: new BigNumber(100) },
      { state: "active", delegate: "a.near", amount: new BigNumber(50) },
      { state: "deactivating", delegate: "a.near", amount: new BigNumber(20) },
      { state: "withdrawable", delegate: "a.near", amount: new BigNumber(10) },
      { state: "active", delegate: "b.near", amount: new BigNumber(7) },
    ]);

    const { result } = renderHook(() => useNearMappedStakingPositions(account));

    expect(result.current).toHaveLength(2);
    const a = result.current.find(p => p.validatorId === "a.near")!;
    expect(a.staked.toFixed()).toBe("150");
    expect(a.pending.toFixed()).toBe("20");
    expect(a.available.toFixed()).toBe("10");
    expect(result.current.find(p => p.validatorId === "b.near")!.staked.toFixed()).toBe("7");

    await settleValidatorFetch();
  });

  it("skips positions without a delegate", async () => {
    const account = makeAccount("1000", "900", [
      { state: "active", amount: new BigNumber(100) },
      { state: "active", delegate: "a.near", amount: new BigNumber(5) },
    ]);

    const { result } = renderHook(() => useNearMappedStakingPositions(account));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].validatorId).toBe("a.near");

    await settleValidatorFetch();
  });

  it("returns an empty list when the account has no positions", async () => {
    const { result } = renderHook(() => useNearMappedStakingPositions(makeAccount("10", "10")));

    expect(result.current).toEqual([]);

    await settleValidatorFetch();
  });
});

describe("useNearStakingPositionsQuerySelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetValidators.mockResolvedValue(validatorPage([]));
  });

  const account = makeAccount("1000", "400", [
    { state: "active", delegate: "staked.near", amount: new BigNumber(100) },
    { state: "withdrawable", delegate: "withdrawable.near", amount: new BigNumber(40) },
  ]);

  it("offers only staked positions for unstake and selects the transaction recipient", async () => {
    const { result } = renderHook(() =>
      useNearStakingPositionsQuerySelector(account, {
        mode: "unstake",
        recipient: "staked.near",
      } as Transaction),
    );

    expect(result.current.options.map(o => o.validatorId)).toEqual(["staked.near"]);
    expect(result.current.value?.validatorId).toBe("staked.near");

    await settleValidatorFetch();
  });

  it("offers only withdrawable positions for withdraw", async () => {
    const { result } = renderHook(() =>
      useNearStakingPositionsQuerySelector(account, {
        mode: "withdraw",
        recipient: "withdrawable.near",
      } as Transaction),
    );

    expect(result.current.options.map(o => o.validatorId)).toEqual(["withdrawable.near"]);

    await settleValidatorFetch();
  });

  it("leaves value undefined when the recipient matches no position", async () => {
    const { result } = renderHook(() =>
      useNearStakingPositionsQuerySelector(account, {
        mode: "unstake",
        recipient: "unknown.near",
      } as Transaction),
    );

    expect(result.current.value).toBeUndefined();

    await settleValidatorFetch();
  });
});

describe("useLedgerFirstShuffledValidatorsNear", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("starts empty, then sorts by stake with the Ledger validator pulled to the front", async () => {
    mockGetValidators.mockResolvedValue(
      validatorPage([
        { address: "small.near", balance: 10n, commissionRate: "0.05" },
        { address: FIGMENT_NEAR_VALIDATOR_ADDRESS, balance: 1n, commissionRate: "0.02" },
        { address: "big.near", balance: 999n, commissionRate: "0.1" },
      ]),
    );

    const { result } = renderHook(() => useLedgerFirstShuffledValidatorsNear(""));

    expect(result.current).toEqual([]);

    await waitFor(() => expect(result.current).toHaveLength(3));
    expect(result.current.map(v => v.validatorAddress)).toEqual([
      FIGMENT_NEAR_VALIDATOR_ADDRESS,
      "big.near",
      "small.near",
    ]);
    expect(result.current[1].commission).toBe(0.1);
    expect(result.current[1].tokens).toBe("999");
  });

  it("filters by the search term", async () => {
    mockGetValidators.mockResolvedValue(
      validatorPage([
        { address: "alpha.near", balance: 5n, commissionRate: "0.05" },
        { address: "beta.near", balance: 3n, commissionRate: "0.05" },
      ]),
    );

    const { result } = renderHook(() => useLedgerFirstShuffledValidatorsNear("BET"));

    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current[0].validatorAddress).toBe("beta.near");
  });

  it("keeps an empty list when the validator request fails", async () => {
    mockGetValidators.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useLedgerFirstShuffledValidatorsNear(""));

    await waitFor(() => expect(mockGetValidators).toHaveBeenCalled());
    expect(result.current).toEqual([]);
  });

  it("maps a null commissionRate to null rather than NaN", async () => {
    mockGetValidators.mockResolvedValue(
      validatorPage([{ address: "nocommission.near", balance: 1n }]),
    );

    const { result } = renderHook(() => useLedgerFirstShuffledValidatorsNear(""));

    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current[0].commission).toBeNull();
  });
});
