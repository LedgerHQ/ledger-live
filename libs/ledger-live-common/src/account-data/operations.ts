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

export type AccountOperationsPageLike = {
  operations: AccountOperation[];
  nextCursor?: string;
  complete: boolean;
  total?: number;
};

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

  // Not a truthiness check: a module can page with `next: 0`, and dropping it would report a
  // partial history as complete.
  const next =
    page.next === undefined || page.next === null || page.next === ""
      ? undefined
      : String(page.next);
  return {
    operations: rows.flat(),
    ...(next === undefined ? {} : { nextCursor: next }),
    complete: next === undefined,
  };
}

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
  reviveFamilyExtra: Parameters<typeof adaptCoreOperationToLiveOperation>[2];
}): Promise<AccountOperation[]> {
  const isNative = coreOperation.asset.type === "native";
  const token = isNative ? undefined : await bridgeApi.getTokenFromAsset?.(coreOperation.asset);
  if (!isNative && !token) return [];

  const ownerId = token ? encodeTokenAccountId(accountId, token) : accountId;
  const assetId = token ? token.id : currencyId;
  const live = adaptCoreOperationToLiveOperation(ownerId, coreOperation, reviveFamilyExtra);
  return flattenOperation(live, id => (id === ownerId ? assetId : undefined));
}

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
