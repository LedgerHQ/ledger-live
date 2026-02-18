import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";
import { log } from "@ledgerhq/logs";
import type { AccountLike } from "@ledgerhq/types-live";
import coinConfig from "../config";
import { Baker, Delegation } from "../types";
import { ledgerValidatorAddress } from "./bakers.whitelist-default";

export type TezosApiBaker = {
  address: string;
  name: string;
  status: string;
  balance: number;
  features: TezosBakerFeature[];
  delegation: {
    enabled: boolean;
    minBalance: number;
    fee: number;
    capacity: number;
    freeSpace: number;
    estimatedApy: number;
    features: TezosBakerFeature[];
  };
  staking: {
    enabled: boolean;
    minBalance: number;
    fee: number;
    capacity: number;
    freeSpace: number;
    estimatedApy: number;
    features: TezosBakerFeature[];
  };
};

export type TezosBakerFeature = {
  title: string;
  content: string | unknown;
};

export const cache = makeLRUCache(
  async (): Promise<Baker[]> => {
    const bakers: Baker[] = [];
    const TEZOS_API_BASE_URL = coinConfig.getCoinConfig().baker.url;
    const { data } = await network<TezosApiBaker[]>({
      url: `${TEZOS_API_BASE_URL}/v3/bakers`,
    });

    if (data && Array.isArray(data)) {
      log("tezos/bakers", "found " + data.length + " bakers");
      data
        .filter(raw => raw.status === "active" && raw.delegation.enabled)
        .forEach(raw => {
          const baker = asBaker(raw);

          if (baker) {
            bakers.push(baker);
          }
        });
      bakers.sort((a, b) => (a.name > b.name ? 1 : -1));
    }

    const ledgerBakerIndex = bakers.findIndex(baker => baker.address === ledgerValidatorAddress);
    const [ledgerBaker] = bakers.splice(ledgerBakerIndex, 1);

    log("tezos/bakers", "loaded " + bakers.length + " bakers");
    return [ledgerBaker, ...bakers];
  },
  () => "",
);

let _lastBakers: Baker[] = [];

export const fetchAllBakers = async (): Promise<Baker[]> => {
  const allBakers = await cache.force();
  _lastBakers = allBakers;
  return allBakers;
};

function whitelist(all: Baker[], addresses: string[]) {
  return all.filter(baker => addresses.includes(baker.address));
}
export const listBakersWithDefault = (whitelistAddresses: string[]): Baker[] => {
  return whitelist(_lastBakers, whitelistAddresses);
};

export const listBakers = async (whitelistAddresses: string[]): Promise<Baker[]> => {
  _lastBakers = await cache();
  return whitelist(_lastBakers, whitelistAddresses);
};

export function getBakerSync(addr: string): Baker | undefined {
  return _lastBakers.find(baker => baker.address === addr);
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

export async function loadBaker(addr: string): Promise<Baker | undefined> {
  const cacheBaker = getBakerSync(addr);
  if (cacheBaker) return cacheBaker;
  const bakers = await cache();
  const baker = bakers.find(baker => baker.address === addr);
  return baker;
}

export async function loadAccountDelegation(
  account: AccountLike,
): Promise<Delegation | null | undefined> {
  const delegation = getAccountDelegationSync(account);
  if (!delegation) return null;
  const baker = await loadBaker(delegation.address);
  return { ...delegation, baker };
}

export const asBaker = (data: TezosApiBaker): Baker | undefined => {
  const { address, name, delegation } = data;

  if (
    typeof name === "string" &&
    typeof address === "string" &&
    typeof delegation.freeSpace === "number" &&
    typeof delegation.estimatedApy === "number" &&
    delegation.estimatedApy >= 0 &&
    delegation.estimatedApy <= 1
  ) {
    return {
      name,
      address,
      logoURL: `https://services.tzkt.io/v1/avatars/${address}`,
      nominalYield: `${Math.floor(10000 * delegation.estimatedApy) / 100} %`,
      capacityStatus: delegation.freeSpace <= 0 ? "full" : "normal",
    };
  }
};

export const hydrateBakers = (bakers: Baker[]): void => {
  log("tezos/bakers", "hydrate " + bakers.length + " bakers");
  cache.hydrate("", bakers);
};
