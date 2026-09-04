import type { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import type { Operation as CoreOperation } from "@ledgerhq/coin-module-framework/api/types";
import type { AccountOperation } from "@domain/entity-account-operations";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getCoinModuleApi } from "../bridge/generic-coin-framework/api/index";
import { buildContext } from "../bridge/generic-coin-framework/api/context";
import { getAccountRawAssignHooks } from "../bridge/generic-coin-framework/accountRawAssign";
import { getBridgeApi } from "../bridge/generic-coin-framework/bridge";
import { adaptCoreOperationToLiveOperation } from "../bridge/generic-coin-framework/utils";
import { flattenOperation, toAccountOperations } from "../legacy-mapping/accountOperation";
import { syncAccountOnce } from "./fullSync";

/** One page of history, in the shape `@features/platform-account-data` consumes. */
export type AccountOperationsPageLike = {
  operations: AccountOperation[];
  nextCursor?: string;
  complete: boolean;
  total?: number;
};

/**
 * Read **one page** of an account's history, and stop there.
 *
 * This is the half of `genericGetAccountShape` that walks the operation list, without the walk: the
 * shape's `paginateOperations` follows the module's cursor chain to the end of the history on every
 * sync, and this deliberately does not. It asks for one page and hands the module's cursor back to
 * the caller, which is the only thing that makes "show me the last 25 transactions" cost 25
 * transactions.
 *
 * `total` is never set. A module that answers one page cannot know how many operations the account
 * has, and reporting the page size here would silently turn every "N transactions" label into a lie.
 *
 * @param kind `"local"` for the in-process coin module, anything else for the coin-service backend.
 */
export async function getAccountOperationPage({
  accountId,
  currencyId,
  address,
  cursor,
  limit,
  kind = "local",
}: {
  accountId: string;
  currencyId: string;
  address: string;
  cursor?: string;
  limit?: number;
  kind?: string;
}): Promise<AccountOperationsPageLike> {
  const currency = getCryptoCurrencyById(currencyId);
  const [api, bridgeApi, { fromOperationExtraRaw: reviveFamilyExtra }] = await Promise.all([
    getCoinModuleApi(currency.id, kind),
    getBridgeApi(currency, currency.family),
    getAccountRawAssignHooks(currency.family),
  ]);

  const page = await api.listOperations(buildContext(currency.id), address, {
    // `0`, not "resume from the newest stored block": this layer holds no account, so there is no
    // stored block to resume from. The cursor is what resumes, and it is the module's own.
    minHeight: 0,
    cursor,
    limit,
    order: "desc",
  });

  const rows = await Promise.all(
    page.items.map(coreOperation =>
      toRows({ coreOperation, accountId, currencyId: currency.id, bridgeApi, reviveFamilyExtra }),
    ),
  );

  // A falsy `next` is end-of-stream — several modules send `""` rather than omitting it, which is
  // why this is a truthiness check and not an `undefined` one.
  const next = page.next ? String(page.next) : undefined;
  return {
    operations: rows.flat(),
    ...(next === undefined ? {} : { nextCursor: next }),
    complete: !next,
  };
}

/**
 * Turn one core operation into entity rows, keyed onto the right account.
 *
 * This is where the granular path has to do by hand what the full sync gets from
 * `inferSubOperations`: a module's `listOperations` reports every operation against the *address*,
 * token transfers included, so without this a token account's history would come back empty on the
 * granular source while the legacy one filled it. Keying the row onto the token account — the same
 * `encodeTokenAccountId` the balance path uses — is what makes the two sources agree.
 *
 * An asset the family cannot name yields no row, for the same reason as in the legacy mapper: an
 * amount rendered against the wrong magnitude is worse than an operation the list does not show.
 */
async function toRows({
  coreOperation,
  accountId,
  currencyId,
  bridgeApi,
  reviveFamilyExtra,
}: {
  coreOperation: CoreOperation;
  accountId: string;
  currencyId: string;
  bridgeApi: Pick<Awaited<ReturnType<typeof getBridgeApi>>, "getTokenFromAsset">;
  reviveFamilyExtra?: Parameters<typeof adaptCoreOperationToLiveOperation>[2];
}): Promise<AccountOperation[]> {
  const isNative = coreOperation.asset.type === "native";
  const token = isNative ? undefined : await bridgeApi.getTokenFromAsset?.(coreOperation.asset);
  if (!isNative && !token) return [];

  const ownerId = token ? encodeTokenAccountId(accountId, token) : accountId;
  const assetId = token ? token.id : currencyId;
  const live = adaptCoreOperationToLiveOperation(ownerId, coreOperation, reviveFamilyExtra);
  return flattenOperation(live, id => (id === ownerId ? assetId : undefined));
}

/**
 * Run a full `AccountBridge.sync()` and project its whole history.
 *
 * The compatibility path, and the one place where the two sources are genuinely not interchangeable:
 * a bridge sync has no notion of a page. It returns everything or nothing, so this always answers
 * with the complete history and never with a cursor — asking it for "the next 25" is not a question
 * it can be asked.
 *
 * The upside of that same fact: it is the only source that can report a `total`, because it is the
 * only one holding the whole history.
 */
export async function syncAccountOperations({
  account,
  bridge,
  blacklistedTokenIds = [],
  signal,
}: {
  account: Account;
  bridge: Pick<AccountBridge<TransactionCommon>, "sync">;
  blacklistedTokenIds?: string[];
  signal?: AbortSignal;
}): Promise<AccountOperationsPageLike> {
  const synced = await syncAccountOnce({ account, bridge, blacklistedTokenIds, signal });
  const operations = toAccountOperations(synced);
  return { operations, complete: true, total: operations.length };
}
