// @flow

// $FlowFixMe not sure why this breaks in desktop side
import { useEffect, useState } from "react";
import type { Operation, AccountLike } from "../../types";
import { log } from "@ledgerhq/logs";
import { BigNumber } from "bignumber.js";
import { makeLRUCache } from "../../cache";
import { getEnv } from "../../env";
import network from "../../network";

const capacityStatuses: { [_: CapacityStatus]: * } = {
  normal: null,
  full: null
};

export type CapacityStatus = $Keys<typeof capacityStatuses>;

export type Baker = {
  address: string,
  name: string,
  logoURL: string,
  nominalYield: string,
  capacityStatus: CapacityStatus
};

// type used by UI to facilitate business logic of current delegation data
export type Delegation = {
  // delegator address
  address: string,
  // if not defined, we need to render "Unknown" on the UI. we don't know who is delegator.
  baker: ?Baker,
  // operation related to delegation (to know the date info)
  operation: Operation,
  // true if the delegation is pending (optimistic update)
  isPending: boolean
};

const cache = makeLRUCache(
  async (): Promise<Baker[]> => {
    const base = getEnv("API_TEZOS_BAKER");
    const { data }: { data: mixed } = await network(`${base}/v1/bakers`);
    const bakers = [];
    if (data && typeof data === "object") {
      const bakersRaw = data.bakers;
      if (
        bakersRaw &&
        typeof bakersRaw === "object" &&
        Array.isArray(bakersRaw)
      ) {
        log("tezos/bakers", "found " + bakersRaw.length + " bakers");
        bakersRaw.forEach(raw => {
          if (raw && typeof raw === "object") {
            const { available_capacity } = raw;
            const availableCapacity = BigNumber(
              typeof available_capacity === "string" ? available_capacity : "0"
            );
            const capacityStatus =
              availableCapacity.isNaN() || availableCapacity.lte(0)
                ? "full"
                : "normal";
            const baker: ?Baker = asBaker({
              address: raw.delegation_code,
              name: raw.baker_name,
              logoURL: raw.logo,
              nominalYield: raw.nominal_staking_yield,
              capacityStatus
            });
            if (baker) {
              bakers.push(baker);
            }
          }
        });
      }
    }

    log("tezos/bakers", "loaded " + bakers.length + " bakers");
    return bakers;
  },
  () => ""
);

let _lastBakers;
export const fetchAllBakers = async () => {
  const r = await cache();
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

export const listBakers = async (
  whitelistAddresses: string[]
): Promise<Baker[]> => {
  const all = await cache();
  return whitelist(all, whitelistAddresses);
};

export function useBakers(whitelistAddresses: string[]) {
  const [bakers, setBakers] = useState(() =>
    whitelist(_lastBakers || [], whitelistAddresses)
  );

  useEffect(() => {
    listBakers(whitelistAddresses).then(setBakers);
  }, [whitelistAddresses]);

  return bakers;
}

export function getBakerSync(addr: string): ?Baker {
  if (_lastBakers) {
    return _lastBakers.find(baker => baker.address === addr);
  }
}

export function getAccountDelegationSync(account: AccountLike): ?Delegation {
  const op = account.operations.find(
    op => !op.hasFailed && op.type === "DELEGATE"
  );
  const pendingOp = !op
    ? account.pendingOperations.find(op => op.type === "DELEGATE")
    : null;
  const operation = op || pendingOp;
  if (!operation || !operation.recipients[0]) {
    return null;
  }
  return {
    isPending: !!pendingOp,
    operation,
    address: operation.recipients[0],
    baker: null
  };
}

export function isAccountDelegating(account: AccountLike): boolean {
  return !!getAccountDelegationSync(account);
}

export async function loadBaker(addr: string): Promise<?Baker> {
  const cacheBaker = getBakerSync(addr);
  if (cacheBaker) return Promise.resolve(cacheBaker);
  const bakers = await cache();
  const baker = bakers.find(baker => baker.address === addr);
  return baker;
}

export async function loadAccountDelegation(
  account: AccountLike
): Promise<?Delegation> {
  const d = getAccountDelegationSync(account);
  if (!d) return Promise.resolve(null);
  const baker = await loadBaker(d.address);
  return {
    ...d,
    baker
  };
}

export function useDelegation(account: AccountLike): ?Delegation {
  const [delegation, setDelegation] = useState(() =>
    getAccountDelegationSync(account)
  );
  useEffect(() => {
    loadAccountDelegation(account).then(setDelegation);
  }, [account]);
  return delegation;
}

export function useBaker(addr: string): ?Baker {
  const [baker, setBaker] = useState(() => getBakerSync(addr));
  useEffect(() => {
    loadBaker(addr).then(setBaker);
  }, [addr]);
  return baker;
}

export const asBaker = (data: mixed): ?Baker => {
  if (data && typeof data === "object") {
    const { address, name, logoURL, nominalYield, capacityStatus } = data;
    if (
      typeof name === "string" &&
      typeof address === "string" &&
      typeof logoURL === "string" &&
      (logoURL.startsWith("https://") || logoURL.startsWith("http://")) &&
      typeof nominalYield === "string" &&
      typeof capacityStatus === "string" &&
      capacityStatus in capacityStatuses
    ) {
      return {
        name,
        address,
        logoURL,
        nominalYield,
        capacityStatus
      };
    }
  }
};

export const hydrateBakers = (bakers: Baker[]) => {
  log("tezos/bakers", "hydrate " + bakers.length + " bakers");
  cache.hydrate("", bakers);
};
