import type { AccountLike } from "@ledgerhq/types-live";
import { useEffect, useMemo, useState } from "react";
import { Baker, Delegation } from "@ledgerhq/coin-tezos/types/index";
import {
  getAccountDelegationSync,
  getBakerSync,
  listBakers,
  listBakersWithDefault,
  loadAccountDelegation,
  loadBaker,
} from "@ledgerhq/coin-tezos/network/index";

export function useBakers(whitelistAddresses: string[]): Baker[] {
  const [bakers, setBakers] = useState<Baker[]>(() => listBakersWithDefault(whitelistAddresses));
  useEffect(() => {
    listBakers(whitelistAddresses).then(setBakers);
  }, [whitelistAddresses]);

  return bakers;
}

export function useDelegation(account: AccountLike): Delegation | null | undefined {
  const [delegation, setDelegation] = useState(() => getAccountDelegationSync(account));
  useEffect(() => {
    let cancelled = false;
    loadAccountDelegation(account).then(delegation => {
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
  const [baker, setBaker] = useState(() => getBakerSync(addr));

  loadBaker(addr).then(setBaker);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bakers.length]);
  return bakers[randomBakerIndex];
}
