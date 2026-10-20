import { lastValueFrom } from "rxjs";
import { tap } from "rxjs/operators";
import type { Account } from "@ledgerhq/types-live";
import { getAccountBridge } from "../../bridge";
import { legacySyncConfig } from "../../bridge/syncConfig";

export type SyncLegacyAccountOptions = {
  prepareCurrency(currency: Account["currency"]): Promise<unknown>;
  blacklistedTokenIds: string[];
  /** Applies each update of the sync to the account the store holds. */
  updateAccountWithUpdater(accountId: string, updater: (account: Account) => Account): void;
};

const inflight = new Map<string, Promise<void>>();
const completedAt = new Map<string, number>();

async function run(
  account: Account,
  { prepareCurrency, blacklistedTokenIds, updateAccountWithUpdater }: SyncLegacyAccountOptions,
): Promise<void> {
  await prepareCurrency(account.currency);
  const bridge = await getAccountBridge(account);
  await lastValueFrom(
    bridge
      .sync(account, legacySyncConfig(account.currency.id, blacklistedTokenIds))
      .pipe(tap(updater => updateAccountWithUpdater(account.id, updater))),
    { defaultValue: undefined },
  );
}

/**
 * Runs the account's `AccountBridge.sync()` into the store, joining the sync in flight for it if any.
 * Skipped when a sync of the account completed less than `maxAge` ms ago.
 */
export function syncLegacyAccount(
  account: Account,
  options: SyncLegacyAccountOptions,
  maxAge = 0,
): Promise<void> {
  const running = inflight.get(account.id);
  if (running) return running;
  const completed = completedAt.get(account.id);
  const age = completed === undefined ? undefined : Date.now() - completed;
  if (age !== undefined && age >= 0 && age < maxAge) return Promise.resolve();
  completedAt.delete(account.id);
  const started = run(account, options)
    .then(() => {
      completedAt.set(account.id, Date.now());
    })
    .finally(() => inflight.delete(account.id));
  inflight.set(account.id, started);
  return started;
}
