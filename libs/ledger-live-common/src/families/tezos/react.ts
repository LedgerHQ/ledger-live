import type { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { useEffect, useMemo, useState } from "react";
import {
  Baker,
  Delegation,
  StakingPosition,
  isTezosAccount,
} from "@ledgerhq/coin-tezos/types/index";
import { bakers } from "@ledgerhq/coin-tezos/network/index";

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
    bakers.loadAccountDelegation(account).then(delegation => {
      if (cancelled) return;
      setDelegation(delegation);
    });
    return () => {
      cancelled = true;
    };
  }, [account]);

  return delegation;
}

export function useBaker(addr: string): Baker | undefined {
  const [baker, setBaker] = useState(() => bakers.getBakerSync(addr));

  bakers.loadBaker(addr).then(setBaker);

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
};

const ZERO = new BigNumber(0);

/**
 * Derived Tezos staking view over `account.stakingPositions[]` (populated by
 * `genericGetAccountShape` when `BridgeApi.usesStakingPositions` is true).
 * Positions are matched by uid prefix per the Paris-upgrade convention from
 * `buildStakesForAccount`: `delegation-*` / `stake-*` / `unstaking-*` /
 * `finalizable-*`. `availableBalance` is the non-staked delegated portion
 * (= `delegation` position amount when delegated, else full balance).
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
      };
    }

    const positions: StakingPosition[] = account.stakingPositions ?? [];
    const findByPrefix = (prefix: string) => positions.find(p => p.uid.startsWith(prefix));

    const delegationPos = findByPrefix("delegation-");
    const stakePos = findByPrefix("stake-");
    const unstakingPos = findByPrefix("unstaking-");
    const finalizablePos = findByPrefix("finalizable-");

    const stakedBalance = stakePos?.amount ?? ZERO;
    const unstakedBalance = unstakingPos?.amount ?? ZERO;
    const unstakedFinalizable = finalizablePos?.amount ?? ZERO;
    const availableBalance = delegationPos?.amount ?? account.balance;
    const delegateAddress = delegationPos?.delegate;

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
    };
  }, [account, delegation]);
}
