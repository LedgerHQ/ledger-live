/**
 * @jest-environment jsdom
 */
import BigNumber from "bignumber.js";
import { renderHook } from "@testing-library/react";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { StakingPosition, TezosAccount } from "@ledgerhq/coin-tezos/types/index";

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

import { useTezosStakingInfo } from "./react";

const ADDRESS = "tz1abc";
const DELEGATE = "tz1baker";

const makeTezosAccount = (positions: StakingPosition[]): TezosAccount =>
  ({
    type: "Account",
    freshAddress: ADDRESS,
    balance: new BigNumber(1000),
    spendableBalance: new BigNumber(1000),
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
});

const stakePos = (amount: number | string): StakingPosition => ({
  uid: `stake-${ADDRESS}`,
  address: ADDRESS,
  delegate: DELEGATE,
  state: "active",
  asset: { type: "native" },
  amount: new BigNumber(amount),
});

const unstakingPos = (amount: number | string): StakingPosition => ({
  uid: `unstaking-${ADDRESS}`,
  address: ADDRESS,
  delegate: DELEGATE,
  state: "deactivating",
  asset: { type: "native" },
  amount: new BigNumber(amount),
});

const finalizablePos = (amount: number | string): StakingPosition => ({
  uid: `finalizable-${ADDRESS}`,
  address: ADDRESS,
  delegate: DELEGATE,
  state: "inactive",
  asset: { type: "native" },
  amount: new BigNumber(amount),
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
    const account = makeTezosAccount([delegationPos(800)]);
    const { result } = renderHook(() => useTezosStakingInfo(account));
    expect(result.current.isDelegated).toBe(true);
    expect(result.current.isStaked).toBe(false);
    expect(result.current.hasUnstaking).toBe(false);
    expect(result.current.delegateAddress).toBe(DELEGATE);
    expect(result.current.availableBalance).toEqual(new BigNumber(800));
    expect(result.current.stakedBalance).toEqual(new BigNumber(0));
  });

  it("delegation + stake: isStaked=true, stakedBalance set", () => {
    const account = makeTezosAccount([delegationPos(700), stakePos(300)]);
    const { result } = renderHook(() => useTezosStakingInfo(account));
    expect(result.current.isDelegated).toBe(true);
    expect(result.current.isStaked).toBe(true);
    expect(result.current.hasUnstaking).toBe(false);
    expect(result.current.stakedBalance).toEqual(new BigNumber(300));
    expect(result.current.availableBalance).toEqual(new BigNumber(700));
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
    const account = makeTezosAccount([
      delegationPos(500),
      stakePos(300),
      unstakingPos(150),
      finalizablePos(50),
    ]);
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
  });
});
