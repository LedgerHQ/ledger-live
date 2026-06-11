/**
 * @jest-environment jsdom
 */
import BigNumber from "bignumber.js";
import { renderHook } from "@testing-library/react";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { Baker, StakingPosition, TezosAccount } from "@ledgerhq/coin-tezos/types/index";

jest.mock("@ledgerhq/coin-tezos/network/index", () => ({
  bakers: {
    listBakersWithDefault: () => [],
    listBakers: jest.fn().mockResolvedValue([]),
    getAccountDelegationSync: jest.fn().mockReturnValue(null),
    loadAccountDelegation: jest.fn().mockResolvedValue(null),
    getBakerSync: jest.fn().mockReturnValue(undefined),
    loadBaker: jest.fn().mockResolvedValue(undefined),
  },
}));

import { bakers } from "@ledgerhq/coin-tezos/network/index";
import { isAwaitingDelegation, useBaker, useTezosStakingInfo } from "./react";

const mockBakers = bakers as unknown as {
  getBakerSync: jest.Mock;
  loadBaker: jest.Mock;
};

const ADDRESS = "tz1abc";
const DELEGATE = "tz1baker";

const makeTezosAccount = (positions: StakingPosition[], spendable = 1000): TezosAccount =>
  ({
    type: "Account",
    freshAddress: ADDRESS,
    balance: new BigNumber(1000),
    spendableBalance: new BigNumber(spendable),
    currency: { family: "tezos" },
    tezosResources: { revealed: true, counter: 0 },
    stakingPositions: positions,
  }) as unknown as TezosAccount;

const delegationPos = (amount: number | string): StakingPosition => ({
  uid: `delegation-${ADDRESS}`,
  address: ADDRESS,
  delegate: DELEGATE,
  state: "active",
  asset: { type: "native" },
  amount: new BigNumber(amount),
  actions: [],
});

const stakePos = (amount: number | string): StakingPosition => ({
  uid: `stake-${ADDRESS}`,
  address: ADDRESS,
  delegate: DELEGATE,
  state: "active",
  asset: { type: "native" },
  amount: new BigNumber(amount),
  actions: [],
});

const unstakingPos = (amount: number | string, id = ADDRESS): StakingPosition => ({
  uid: `unstaking-${id}`,
  address: ADDRESS,
  delegate: DELEGATE,
  state: "deactivating",
  asset: { type: "native" },
  amount: new BigNumber(amount),
  actions: [],
});

const finalizablePos = (amount: number | string, id = ADDRESS): StakingPosition => ({
  uid: `finalizable-${id}`,
  address: ADDRESS,
  delegate: DELEGATE,
  state: "inactive",
  asset: { type: "native" },
  amount: new BigNumber(amount),
  actions: [],
});

describe("useTezosStakingInfo", () => {
  it("returns defaults for a Tezos account with no positions, but availableBalance = balance", () => {
    const account = makeTezosAccount([]);
    const { result } = renderHook(() => useTezosStakingInfo(account));
    expect(result.current).toMatchObject({
      isDelegated: false,
      isStaked: false,
      hasUnstaking: false,
      stakedBalance: new BigNumber(0),
      unstakedBalance: new BigNumber(0),
      unstakedFinalizable: new BigNumber(0),
      availableBalance: new BigNumber(1000),
      delegateAddress: undefined,
    });
  });

  it("delegation only: isDelegated=true, availableBalance = delegation amount", () => {
    const account = makeTezosAccount([delegationPos(800)], 800);
    const { result } = renderHook(() => useTezosStakingInfo(account));
    expect(result.current.isDelegated).toBe(true);
    expect(result.current.isStaked).toBe(false);
    expect(result.current.hasUnstaking).toBe(false);
    expect(result.current.delegateAddress).toBe(DELEGATE);
    expect(result.current.availableBalance).toEqual(new BigNumber(800));
    expect(result.current.stakedBalance).toEqual(new BigNumber(0));
  });

  it("delegation + stake: isStaked=true, stakedBalance set", () => {
    const account = makeTezosAccount([delegationPos(700), stakePos(300)], 700);
    const { result } = renderHook(() => useTezosStakingInfo(account));
    expect(result.current.isDelegated).toBe(true);
    expect(result.current.isStaked).toBe(true);
    expect(result.current.hasUnstaking).toBe(false);
    expect(result.current.stakedBalance).toEqual(new BigNumber(300));
    expect(result.current.availableBalance).toEqual(new BigNumber(700));
  });

  it("non-delegated stake: availableBalance = balance - stakedBalance", () => {
    const account = makeTezosAccount([stakePos(300)], 700);
    const { result } = renderHook(() => useTezosStakingInfo(account));
    expect(result.current.isDelegated).toBe(false);
    expect(result.current.isStaked).toBe(true);
    expect(result.current.stakedBalance).toEqual(new BigNumber(300));
    expect(result.current.availableBalance).toEqual(new BigNumber(700));
  });

  it("non-delegated with unstaking: availableBalance excludes staked and cooling-down funds", () => {
    const account = makeTezosAccount([stakePos(300), unstakingPos(100)], 600);
    const { result } = renderHook(() => useTezosStakingInfo(account));
    expect(result.current.isDelegated).toBe(false);
    expect(result.current.availableBalance).toEqual(new BigNumber(600));
  });

  it("falls back to legacy useDelegation when stakingPositions is empty", () => {
    const legacyDelegation = {
      address: DELEGATE,
      baker: null,
      operation: { hash: "h", date: new Date() },
      isPending: false,
      receiveShouldWarnDelegation: false,
      sendShouldWarnDelegation: false,
    };
    (
      bakers as unknown as { getAccountDelegationSync: jest.Mock }
    ).getAccountDelegationSync.mockReturnValueOnce(legacyDelegation);
    const account = makeTezosAccount([]);
    const { result } = renderHook(() => useTezosStakingInfo(account));
    expect(result.current.isDelegated).toBe(true);
    expect(result.current.delegateAddress).toBe(DELEGATE);
  });

  it("delegation + unstaking (still cooling): hasUnstaking=true, unstakedBalance set", () => {
    const account = makeTezosAccount([delegationPos(900), unstakingPos(100)]);
    const { result } = renderHook(() => useTezosStakingInfo(account));
    expect(result.current.hasUnstaking).toBe(true);
    expect(result.current.unstakedBalance).toEqual(new BigNumber(100));
    expect(result.current.unstakedFinalizable).toEqual(new BigNumber(0));
  });

  it("delegation + finalizable: hasUnstaking=true, unstakedFinalizable set", () => {
    const account = makeTezosAccount([delegationPos(900), finalizablePos(100)]);
    const { result } = renderHook(() => useTezosStakingInfo(account));
    expect(result.current.hasUnstaking).toBe(true);
    expect(result.current.unstakedBalance).toEqual(new BigNumber(0));
    expect(result.current.unstakedFinalizable).toEqual(new BigNumber(100));
  });

  it("all four positions: every flag true, every amount populated", () => {
    const account = makeTezosAccount(
      [delegationPos(500), stakePos(300), unstakingPos(150), finalizablePos(50)],
      500,
    );
    const { result } = renderHook(() => useTezosStakingInfo(account));
    expect(result.current).toMatchObject({
      isDelegated: true,
      isStaked: true,
      hasUnstaking: true,
      stakedBalance: new BigNumber(300),
      unstakedBalance: new BigNumber(150),
      unstakedFinalizable: new BigNumber(50),
      availableBalance: new BigNumber(500),
      delegateAddress: DELEGATE,
    });
  });

  it("returns defaults for a token account (sub-account)", () => {
    const tokenAccount = {
      type: "TokenAccount",
      balance: new BigNumber(42),
    } as unknown as TokenAccount;
    const { result } = renderHook(() => useTezosStakingInfo(tokenAccount));
    expect(result.current).toMatchObject({
      isDelegated: false,
      isStaked: false,
      hasUnstaking: false,
      stakedBalance: new BigNumber(0),
      availableBalance: new BigNumber(0),
      delegateAddress: undefined,
    });
  });

  it("classifies a Paris-upgrade Tezos account without tezosResources", () => {
    const account = {
      type: "Account",
      freshAddress: ADDRESS,
      balance: new BigNumber(1000),
      spendableBalance: new BigNumber(700),
      currency: { family: "tezos" },
      stakingPositions: [delegationPos(700), stakePos(300)],
    } as unknown as TezosAccount;
    const { result } = renderHook(() => useTezosStakingInfo(account));
    expect(result.current.isDelegated).toBe(true);
    expect(result.current.isStaked).toBe(true);
    expect(result.current.stakedBalance).toEqual(new BigNumber(300));
    expect(result.current.availableBalance).toEqual(new BigNumber(700));
  });

  it("handles a Tezos account with stakingPositions undefined", () => {
    const account = {
      type: "Account",
      freshAddress: ADDRESS,
      balance: new BigNumber(500),
      spendableBalance: new BigNumber(500),
      currency: { family: "tezos" },
    } as unknown as TezosAccount;
    const { result } = renderHook(() => useTezosStakingInfo(account));
    expect(result.current.isDelegated).toBe(false);
    expect(result.current.isStaked).toBe(false);
    expect(result.current.availableBalance).toEqual(new BigNumber(500));
    expect(result.current.unstakingPositions).toEqual([]);
  });

  it("returns defaults for a non-Tezos Account (no tezosResources field)", () => {
    const ethAccount = {
      type: "Account",
      freshAddress: "0xabc",
      balance: new BigNumber(1234),
      currency: { family: "ethereum" },
    } as unknown as Account;
    const { result } = renderHook(() => useTezosStakingInfo(ethAccount));
    expect(result.current).toMatchObject({
      isDelegated: false,
      availableBalance: new BigNumber(0),
    });
    expect(result.current.unstakingPositions).toEqual([]);
  });

  it("sums multiple unstaking-* positions into unstakedBalance", () => {
    const account = makeTezosAccount([
      delegationPos(500),
      unstakingPos(40, "1"),
      unstakingPos(60, "2"),
    ]);
    const { result } = renderHook(() => useTezosStakingInfo(account));
    expect(result.current.unstakedBalance).toEqual(new BigNumber(100));
    expect(result.current.hasUnstaking).toBe(true);
    expect(result.current.unstakingPositions).toHaveLength(2);
  });

  it("sums multiple finalizable-* positions into unstakedFinalizable", () => {
    const account = makeTezosAccount([
      delegationPos(500),
      finalizablePos(15, "1"),
      finalizablePos(25, "2"),
    ]);
    const { result } = renderHook(() => useTezosStakingInfo(account));
    expect(result.current.unstakedFinalizable).toEqual(new BigNumber(40));
    expect(result.current.unstakingPositions).toHaveLength(2);
  });

  it("exposes unstakingPositions in pending-then-finalizable order", () => {
    const account = makeTezosAccount([
      delegationPos(500),
      finalizablePos(20, "fin1"),
      unstakingPos(30, "pen1"),
      unstakingPos(10, "pen2"),
    ]);
    const { result } = renderHook(() => useTezosStakingInfo(account));
    expect(result.current.unstakingPositions.map(p => p.uid)).toEqual([
      "unstaking-pen1",
      "unstaking-pen2",
      "finalizable-fin1",
    ]);
  });
});

describe("useBaker", () => {
  beforeEach(() => {
    mockBakers.getBakerSync.mockReset().mockReturnValue(undefined);
    mockBakers.loadBaker.mockReset().mockResolvedValue(undefined);
  });

  it("does not call loadBaker on every render (only on addr change)", async () => {
    const { rerender } = renderHook(({ addr }: { addr: string }) => useBaker(addr), {
      initialProps: { addr: "tz1abc" },
    });
    await Promise.resolve();
    rerender({ addr: "tz1abc" });
    rerender({ addr: "tz1abc" });
    expect(mockBakers.loadBaker).toHaveBeenCalledTimes(1);
  });

  it("calls loadBaker again when addr changes", async () => {
    const { rerender } = renderHook(({ addr }: { addr: string }) => useBaker(addr), {
      initialProps: { addr: "tz1a" },
    });
    await Promise.resolve();
    rerender({ addr: "tz1b" });
    await Promise.resolve();
    expect(mockBakers.loadBaker).toHaveBeenNthCalledWith(1, "tz1a");
    expect(mockBakers.loadBaker).toHaveBeenNthCalledWith(2, "tz1b");
  });

  it("skips loadBaker when addr is empty", () => {
    renderHook(() => useBaker(""));
    expect(mockBakers.loadBaker).not.toHaveBeenCalled();
    expect(mockBakers.getBakerSync).not.toHaveBeenCalled();
  });

  it("swallows loadBaker rejection (no unhandled error)", async () => {
    mockBakers.loadBaker.mockRejectedValueOnce(new Error("network down"));
    const { result } = renderHook(() => useBaker("tz1abc"));
    await Promise.resolve();
    await Promise.resolve();
    expect(result.current).toBeUndefined();
  });

  it("returns the cached baker for the new addr immediately on addr change", () => {
    const bakerA = { address: "tz1a", name: "A" } as unknown as Baker;
    const bakerB = { address: "tz1b", name: "B" } as unknown as Baker;
    mockBakers.getBakerSync.mockImplementation((a: string) =>
      a === "tz1a" ? bakerA : a === "tz1b" ? bakerB : undefined,
    );
    const { result, rerender } = renderHook(({ addr }: { addr: string }) => useBaker(addr), {
      initialProps: { addr: "tz1a" },
    });
    expect(result.current).toBe(bakerA);
    rerender({ addr: "tz1b" });
    expect(result.current).toBe(bakerB);
  });
});

describe("isAwaitingDelegation", () => {
  const tx = (mode: string) => ({ mode });
  const pending = { isPending: true } as const;
  const confirmed = { isPending: false } as const;

  it("returns false outside stake mode", () => {
    expect(isAwaitingDelegation(pending, tx("send"))).toBe(false);
    expect(isAwaitingDelegation(pending, tx("delegate"))).toBe(false);
    expect(isAwaitingDelegation(null, tx("delegate"))).toBe(false);
  });

  it("returns true in stake mode when delegation is absent or pending", () => {
    expect(isAwaitingDelegation(null, tx("stake"))).toBe(true);
    expect(isAwaitingDelegation(undefined, tx("stake"))).toBe(true);
    expect(isAwaitingDelegation(pending, tx("stake"))).toBe(true);
  });

  it("returns false in stake mode once delegation is confirmed", () => {
    expect(isAwaitingDelegation(confirmed, tx("stake"))).toBe(false);
  });

  it("returns false when transaction is null/undefined", () => {
    expect(isAwaitingDelegation(pending, null)).toBe(false);
    expect(isAwaitingDelegation(pending, undefined)).toBe(false);
  });
});
