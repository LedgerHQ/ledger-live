import type { Account } from "@ledgerhq/types-live";
import { AccountDataNotServedError, type AccountTarget } from "@domain/api-account-data";
import { TronResourcesSchema, type TronResources } from "@domain/entity-account-tron";
import { isTronAccount } from "./types";

const notTron = (what: string) =>
  new AccountDataNotServedError(`tron:resources is only for a Tron account, not ${what}`);

/** The `"tron:resources"` kind of a synced Tron account; frozen TRX goes to the balance's `locked`. */
export function toTronResources(account: Account): TronResources {
  if (!isTronAccount(account)) throw notTron(account.currency.id);
  const { energy, bandwidth, tronPower } = account.tronResources;
  return TronResourcesSchema.parse({
    energy: energy.toFixed(0),
    bandwidth: {
      freeUsed: bandwidth.freeUsed.toFixed(0),
      freeLimit: bandwidth.freeLimit.toFixed(0),
      gainedUsed: bandwidth.gainedUsed.toFixed(0),
      gainedLimit: bandwidth.gainedLimit.toFixed(0),
    },
    tronPower,
  });
}

/** Rejects another network before syncing it, so the router asks the next source. */
export async function readTronResources(
  target: AccountTarget,
  sync: (target: AccountTarget) => Promise<Account>,
): Promise<TronResources> {
  if (target.descriptor.network !== "tron") throw notTron(target.descriptor.network);
  return toTronResources(await sync(target));
}
