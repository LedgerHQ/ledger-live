import type { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { useEffect, useMemo, useState } from "react";
import { log } from "@ledgerhq/logs";
import {
  Baker,
  Delegation,
  StakingPosition,
  isTezosAccount,
} from "@ledgerhq/coin-tezos/types/index";
import { bakers } from "@ledgerhq/coin-tezos/network/index";
import {
  isDelegationPosition,
  isFinalizablePosition,
  isStakePosition,
  isUnstakingPosition,
} from "@ledgerhq/coin-tezos/logic/getStakes";

export { isDelegationPosition, isFinalizablePosition, isStakePosition, isUnstakingPosition };

export function useBakers(whitelistAddresses: string[]): Baker[] {
  const [whitelistedBakers, setWhitelistedBakers] = useState<Baker[]>(() =>
    bakers.listBakersWithDefault(whitelistAddresses),
  );
  useEffect(() => {
    bakers.listBakers(whitelistAddresses).then(setWhitelistedBakers);
  }, [whitelistAddresses]);

  return whitelistedBakers;
}

export function useDelegation(account: AccountLike): Delegation | null | undefined {
  const [delegation, setDelegation] = useState(() => bakers.getAccountDelegationSync(account));
  useEffect(() => {
    let cancelled = false;
    bakers
      .loadAccountDelegation(account)
      .then(delegation => {
        if (cancelled) return;
        setDelegation(delegation);
      })
      .catch(err => {
        if (cancelled) return;
        log("coin:tezos", "useDelegation: loadAccountDelegation failed", { error: err });
      });
    return () => {
      cancelled = true;
    };
  }, [account]);

  return delegation;
}

export function useBaker(addr: string): Baker | undefined {
  const [baker, setBaker] = useState(() => (addr ? bakers.getBakerSync(addr) : undefined));

  useEffect(() => {
    if (!addr) {
      setBaker(undefined);
      return;
    }
    let cancelled = false;
    bakers
      .loadBaker(addr)
      .then(b => {
        if (cancelled) return;
        setBaker(b);
      })
      .catch(err => {
        if (cancelled) return;
        log("coin:tezos", "useBaker: loadBaker failed", { error: err });
      });
    return () => {
      cancelled = true;
    };
  }, [addr]);

  return baker;
}

//  select a random baker for the mount time (assuming bakers length don't change)
export function useRandomBaker(bakers: Baker[]): Baker {
  const randomBakerIndex = useMemo(() => {
    const nonFullBakers = bakers.filter(b => b.capacityStatus !== "full");

    if (nonFullBakers.length > 0) {
      // if there are non full bakers, we pick one
      const i = Math.floor(Math.random() * nonFullBakers.length);
      return bakers.indexOf(nonFullBakers[i]);
    }

    // fallback on random between only full bakers
    return Math.floor(Math.random() * bakers.length); // for perf, we only want to re-calc on bakers.length changes
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [bakers.length]);
  return bakers[randomBakerIndex];
}

export function useStakingPositions(account: AccountLike): StakingPosition[] {
  const delegation = useDelegation(account);

  return useMemo(() => {
    if (account.type !== "Account" || !delegation?.address) return [];

    return [
      {
        uid: account.freshAddress,
        address: account.freshAddress,
        delegate: delegation.address,
        state: "active" as const,
        asset: { type: "native" as const },
        amount: account.balance,
        actions: [],
      },
    ];
  }, [account, delegation]);
}

export type TezosStakingInfo = {
  isDelegated: boolean;
  isStaked: boolean;
  hasUnstaking: boolean;
  delegation: Delegation | null | undefined;
  stakedBalance: BigNumber;
  unstakedBalance: BigNumber;
  unstakedFinalizable: BigNumber;
  availableBalance: BigNumber;
  delegateAddress: string | undefined;
  /** Pending then finalizable, in TzKT request-id order within each group. */
  unstakingPositions: StakingPosition[];
};

const ZERO = new BigNumber(0);

const sumAmounts = (positions: StakingPosition[]) =>
  positions.reduce<BigNumber>((sum, p) => sum.plus(p.amount), ZERO);

/**
 * Derived staking view over `account.stakingPositions[]` (populated by
 * `genericGetAccountShape` when `BridgeApi.usesStakingPositions`). Classifies positions
 * via the uid prefixes set by `buildStakesForAccount`.
 */
export function useTezosStakingInfo(account: AccountLike): TezosStakingInfo {
  const delegation = useDelegation(account);

  return useMemo(() => {
    if (account.type !== "Account" || !isTezosAccount(account)) {
      return {
        isDelegated: false,
        isStaked: false,
        hasUnstaking: false,
        delegation,
        stakedBalance: ZERO,
        unstakedBalance: ZERO,
        unstakedFinalizable: ZERO,
        availableBalance: ZERO,
        delegateAddress: undefined,
        unstakingPositions: [],
      };
    }

    const positions: StakingPosition[] = account.stakingPositions ?? [];
    const delegationPos = positions.find(p => isDelegationPosition(p.uid));
    const stakePos = positions.find(p => isStakePosition(p.uid));
    const pendingPositions = positions.filter(p => isUnstakingPosition(p.uid));
    const finalizablePositions = positions.filter(p => isFinalizablePosition(p.uid));

    const stakedBalance = stakePos?.amount ?? ZERO;
    const unstakedBalance = sumAmounts(pendingPositions);
    const unstakedFinalizable = sumAmounts(finalizablePositions);
    // account.balance includes the staked portion on Tezos — subtract when no delegation-* position.
    const availableBalance = delegationPos?.amount ?? account.balance.minus(stakedBalance);
    const delegateAddress = delegationPos?.delegate ?? delegation?.address;

    return {
      isDelegated: !!delegateAddress,
      isStaked: stakedBalance.gt(0),
      hasUnstaking: unstakedBalance.gt(0) || unstakedFinalizable.gt(0),
      delegation,
      stakedBalance,
      unstakedBalance,
      unstakedFinalizable,
      availableBalance,
      delegateAddress,
      unstakingPositions: [...pendingPositions, ...finalizablePositions],
    };
  }, [account, delegation]);
}
