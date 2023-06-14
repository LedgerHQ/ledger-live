import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";
import { log } from "@ledgerhq/logs";
import type { AccountLike, Operation } from "@ledgerhq/types-live";
import { useEffect, useMemo, useState } from "react";
import { getEnv } from "../../env";
const capacityStatuses = {
  normal: null,
  full: null,
};
export type CapacityStatus = keyof typeof capacityStatuses;
export type Baker = {
  address: string;
  name: string;
  logoURL: string;
  nominalYield: string;
  capacityStatus: CapacityStatus;
};
// type used by UI to facilitate business logic of current delegation data
export type Delegation = {
  // delegator address
  address: string;
  // if not defined, we need to render "Unknown" on the UI. we don't know who is delegator.
  baker: Baker | null | undefined;
  // operation related to delegation (to know the date info)
  operation: Operation;
  // true if the delegation is pending (optimistic update)
  isPending: boolean;
  // true if a receive should inform it will top up the delegation
  receiveShouldWarnDelegation: boolean;
  // true if a send should inform it will top down the delegation
  sendShouldWarnDelegation: boolean;
};
const cache = makeLRUCache(
  async (): Promise<Baker[]> => {
    const base = getEnv("API_TEZOS_BAKER");
    const {
      data,
    }: {
      data: unknown;
    } = await network({
      url: `${base}/v2/bakers`,
    });
    const bakers: Baker[] = [];

    if (data && typeof data === "object" && Array.isArray(data)) {
      log("tezos/bakers", "found " + data.length + " bakers");
      data
        .filter(raw => raw.serviceHealth === "active")
        .forEach(raw => {
          const baker: Baker | null | undefined = asBaker(raw);

          if (baker) {
            bakers.push(baker);
          }
        });
    }

    log("tezos/bakers", "loaded " + bakers.length + " bakers");
    return bakers;
  },
  () => "",
);

let _lastBakers: Baker[];

export const fetchAllBakers = async (): Promise<Baker[]> => {
  const r = await cache.force();
  _lastBakers = r;
  return r;
};

function whitelist(all: Baker[], addresses: string[]) {
  const map = {};
  all.forEach(b => {
    map[b.address] = b;
  });
  return addresses.map(addr => map[addr]).filter(Boolean);
}

export const listBakers = async (whitelistAddresses: string[]): Promise<Baker[]> => {
  const all = await cache();
  _lastBakers = all;
  return whitelist(all, whitelistAddresses);
};
export function useBakers(whitelistAddresses: string[]): Baker[] {
  const [bakers, setBakers] = useState<Baker[]>(() =>
    whitelist(_lastBakers || [], whitelistAddresses),
  );
  useEffect(() => {
    let cancelled;
    listBakers(whitelistAddresses).then(bakers => {
      if (cancelled) return;
      setBakers(bakers);
    });
    return () => {
      cancelled = true;
    };
  }, [whitelistAddresses]);
  return bakers;
}
export function getBakerSync(addr: string): Baker | null | undefined {
  if (_lastBakers) {
    return _lastBakers.find(baker => baker.address === addr);
  }
}
export function getAccountDelegationSync(account: AccountLike): Delegation | null | undefined {
  const op = account.operations.find(
    op => !op.hasFailed && (op.type === "DELEGATE" || op.type === "UNDELEGATE"),
  );
  const pendingOp = account.pendingOperations
    .filter(op => !account.operations.some(o => op.hash === o.hash))
    .find(op => op.type === "DELEGATE" || op.type === "UNDELEGATE");
  const isPending = !!pendingOp;
  const operation = pendingOp && pendingOp.type === "DELEGATE" ? pendingOp : op;

  if (!operation || operation.type === "UNDELEGATE") {
    return null;
  }

  const recentOps = account.operations
    .filter(op => op.date > operation.date)
    .concat(account.pendingOperations);
  const sendShouldWarnDelegation = !recentOps.some(op => op.type === "OUT");
  const receiveShouldWarnDelegation = !recentOps.some(op => op.type === "IN");
  return {
    isPending,
    operation,
    address: operation.recipients[0],
    baker: null,
    sendShouldWarnDelegation,
    receiveShouldWarnDelegation,
  };
}
export function isAccountDelegating(account: AccountLike): boolean {
  return !!getAccountDelegationSync(account);
}
export async function loadBaker(addr: string): Promise<Baker | null | undefined> {
  const cacheBaker = getBakerSync(addr);
  if (cacheBaker) return Promise.resolve(cacheBaker);
  const bakers = await cache();
  const baker = bakers.find(baker => baker.address === addr);
  return baker;
}
export async function loadAccountDelegation(
  account: AccountLike,
): Promise<Delegation | null | undefined> {
  const d = getAccountDelegationSync(account);
  if (!d) return Promise.resolve(null);
  const baker = await loadBaker(d.address);
  return { ...d, baker };
}
export function useDelegation(account: AccountLike): Delegation | null | undefined {
  const [delegation, setDelegation] = useState(() => getAccountDelegationSync(account));
  useEffect(() => {
    let cancelled;
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
export function useBaker(addr: string): Baker | null | undefined {
  const [baker, setBaker] = useState(() => getBakerSync(addr));
  useEffect(() => {
    let cancelled;
    loadBaker(addr).then(baker => {
      if (cancelled) return;
      setBaker(baker);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bakers.length]);
  return bakers[randomBakerIndex];
}
export const asBaker = (data: Record<string, unknown>): Baker | null | undefined => {
  if (data && typeof data === "object") {
    const { address, name, logo, freeSpace, estimatedRoi } = data;

    if (
      typeof name === "string" &&
      typeof address === "string" &&
      typeof logo === "string" &&
      (logo.startsWith("https://") || logo.startsWith("http://")) &&
      typeof freeSpace === "number" &&
      typeof estimatedRoi === "number" &&
      0 <= estimatedRoi &&
      estimatedRoi <= 1
    ) {
      return {
        name,
        address,
        logoURL: logo,
        nominalYield: Math.floor(10000 * estimatedRoi) / 100 + " %",
        capacityStatus: freeSpace <= 0 ? "full" : "normal",
      };
    }
  }
};
export const hydrateBakers = (bakers: Baker[]): void => {
  log("tezos/bakers", "hydrate " + bakers.length + " bakers");
  cache.hydrate("", bakers);
};
