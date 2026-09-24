import { act } from "react";
import invariant from "invariant";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { StacksAccount, StakingPosition } from "@ledgerhq/live-common/families/stacks/types";
import { renderHook } from "tests/testSetup";

import AccountHeaderActions from "../AccountHeaderManageActions";

const currency = getCryptoCurrencyById("stacks");

const makeAccount = (stakingPositions?: StakingPosition[]): StacksAccount =>
  ({
    ...genAccount("stacks-test", { currency }),
    stakingPositions,
  }) as unknown as StacksAccount;

describe("AccountHeaderManageActions (stacks)", () => {
  const hook = AccountHeaderActions;
  invariant(hook, "stacks: type guard AccountHeaderActions");

  it("returns null when called with a parentAccount (sub-account)", () => {
    const account = makeAccount();
    const { result } = renderHook(() =>
      hook({ account, parentAccount: account, source: "Account Page" }),
    );
    expect(result.current).toBeNull();
  });

  it("returns exactly one action (Stake) when there is no staking position", () => {
    const account = makeAccount(undefined);
    const { result, store } = renderHook(() =>
      hook({ account, parentAccount: null, source: "Account Page" }),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current?.[0].key).toBe("Stake");

    act(() => {
      result.current?.[0].onClick();
    });

    const modal = store.getState().modals.MODAL_STACKS_STAKE;
    expect(modal).toEqual(
      expect.objectContaining({
        isOpened: true,
        data: expect.objectContaining({ account }),
      }),
    );
  });

  it("returns two actions (Stake, Unstake) when a staking position exists; clicking Unstake opens MODAL_STACKS_UNSTAKE", () => {
    const position = {
      uid: "SP1staker",
      address: "SP1staker",
      delegate: "SP1pool.native-pool-signer-manager",
      state: "active",
      asset: { type: "native" },
      amount: 0,
      actions: ["undelegate"],
      details: { firstRewardCycle: 10, numCycles: 6, rewardAsset: "sbtc", amountRewarded: "0" },
    } as unknown as StakingPosition;
    const account = makeAccount([position]);
    const { result, store } = renderHook(() =>
      hook({ account, parentAccount: null, source: "Account Page" }),
    );

    expect(result.current).toHaveLength(2);
    expect(result.current?.map(a => a.key)).toEqual(["Stake", "Unstake"]);
    expect(result.current?.[1].label).toBe("Unstake");
    expect(result.current?.[1].label).not.toBe(result.current?.[0].label);

    act(() => {
      result.current?.[1].onClick();
    });

    const modal = store.getState().modals.MODAL_STACKS_UNSTAKE;
    expect(modal).toEqual(
      expect.objectContaining({
        isOpened: true,
        data: expect.objectContaining({ account }),
      }),
    );
  });

  it("returns exactly one action (Stake) when the staking position is 'deactivating' (its final reward cycle)", () => {
    // getStakes.ts only sets `actions: ["undelegate"]` while `state === "active"`; a fresh unstake
    // on a "deactivating" position is redundant/invalid on-chain.
    const position = {
      uid: "SP1staker",
      address: "SP1staker",
      delegate: "SP1pool.native-pool-signer-manager",
      state: "deactivating",
      asset: { type: "native" },
      amount: 0,
      actions: [],
      details: { firstRewardCycle: 10, numCycles: 6, rewardAsset: "sbtc", amountRewarded: "0" },
    } as unknown as StakingPosition;
    const account = makeAccount([position]);
    const { result } = renderHook(() =>
      hook({ account, parentAccount: null, source: "Account Page" }),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current?.[0].key).toBe("Stake");
  });
});
