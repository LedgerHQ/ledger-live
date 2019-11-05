// @flow

import type { Operation, Account } from "../../types";
import { log } from "@ledgerhq/logs";
import { BigNumber } from "bignumber.js";
import { makeLRUCache } from "../../cache";
import { getEnv } from "../../env";
import network from "../../network";

const capacityStatuses: { [_: CapacityStatus]: * } = {
  normal: null,
  busy: null,
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

export const fetchAllBakers = () => cache();

export const listBakers = async (
  whitelistAddresses: string[]
): Promise<Baker[]> => {
  const map = {};
  const all = await cache();
  all.forEach(b => {
    map[b.address] = b;
  });
  return whitelistAddresses.map(addr => map[addr]).filter(Boolean);
};

export async function loadAccountDelegation(
  account: Account
): Promise<?Delegation> {
  const op = account.operations.find(op => op.type === "DELEGATE");
  const pendingOp = !op
    ? account.pendingOperations.find(op => op.type === "DELEGATE")
    : null;
  const operation = op || pendingOp;
  if (!operation || !operation.recipients[0]) return Promise.resolve(null);
  const address = operation.recipients[0];
  const bakers = await cache();
  const baker = bakers.find(baker => baker.address === address);
  return {
    address,
    baker,
    operation,
    isPending: !!pendingOp
  };
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
