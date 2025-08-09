import type { AccountLike } from "@ledgerhq/types-live";
import { useEffect, useMemo, useState } from "react";
import { Baker, Delegation, TezosAccount, StakingPosition } from "@ledgerhq/coin-tezos/types/index";
import { bakers } from "@ledgerhq/coin-tezos/network/index";
import tzkt from "@ledgerhq/coin-tezos/network/tzkt";

export function useBakers(whitelistAddresses: string[]): Baker[] {
  const [whitelistedBakers, setWhitelistedBakers] = useState<Baker[]>(() =>
    bakers.listBakersWithDefault(whitelistAddresses),
  );
  useEffect(() => {
    bakers.listBakers(whitelistAddresses).then(setWhitelistedBakers);
  }, [bakers, whitelistAddresses]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bakers.length]);
  return bakers[randomBakerIndex];
}

// expose staking positions via generic bridge getStakes
export function useStakingPositions(account: TezosAccount): StakingPosition[] {
  const [delegation, setDelegation] = useState(() => bakers.getAccountDelegationSync(account));

  // ensure delegation is loaded when needed
  useEffect(() => {
    let cancelled = false;
    bakers.loadAccountDelegation(account).then(async d => {
      if (cancelled) return;
      if (d && ("address" in d) && d.address) {
        setDelegation(d);
      } else {
        // fallback: query tzkt directly in dev if cache is empty
        try {
          const info = await tzkt.getAccountByAddress(account.freshAddress);
          if (info.type === "user" && info.delegate?.address) {
            setDelegation({ address: info.delegate.address } as any);
          }
        } catch {}
      }
    });
    return () => {
      cancelled = true;
    };
  }, [account]);

  return useMemo(() => {
    const d = delegation;
    if (!d || !("address" in d) || !d.address) return [];
    return [
      {
        uid: account.freshAddress,
        address: account.freshAddress,
        delegate: d.address,
        state: "active",
        asset: { type: "native" },
        amount: BigInt(account.balance.toString()),
      },
    ];
  }, [account, delegation]);
}
