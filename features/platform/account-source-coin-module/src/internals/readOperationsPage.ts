import type { AccountOperation, AccountOperationsPage } from "@domain/entity-account-operation";
import type { CoinModuleOperationsApi } from "../host";
import {
  listedOperationsOf,
  toAccountOperations,
  type ListedOperation,
} from "./toAccountOperations";

/** The most coin module pages one read walks when its filters empty them. */
export const MAX_PAGES_PER_READ = 5;

type PageRequest = {
  currencyId: string;
  /** The address the coin module reads, or the xpub of a utxo account. */
  subject: string;
  cursor?: string;
  limit?: number;
  /** Only the rows of this asset; the coin module lists every asset, so the source filters them. */
  filterAsset?: string;
  blacklistedTokenIds: ReadonlySet<string>;
};

/** One `operations` page: coin module pages until `limit` rows of the asset asked are built (one, without a limit), the list ends, or the budget is spent. */
export async function readOperationsPage(
  api: CoinModuleOperationsApi,
  { currencyId, subject, cursor, limit, filterAsset, blacklistedTokenIds }: PageRequest,
): Promise<AccountOperationsPage> {
  // Rows are built from every asset so a token row still points at its transaction's native one.
  const rowsOf = (listed: ListedOperation[]): AccountOperation[] => {
    const rows = toAccountOperations(currencyId, subject, listed);
    return filterAsset === undefined ? rows : rows.filter(row => row.assetId === filterAsset);
  };
  const listed: ListedOperation[] = [];
  let operations: AccountOperation[] = [];
  let next = cursor;
  for (let read = 0; read < MAX_PAGES_PER_READ; read++) {
    const from = next;
    const page = await api.listOperations(subject, { cursor: from, limit });
    listed.push(...(await listedOperationsOf(currencyId, page.items, api, blacklistedTokenIds)));
    operations = rowsOf(listed);
    // A cursor that does not advance would page forever: the list ends there.
    next = page.next && page.next !== from ? page.next : undefined;
    if (!next || operations.length >= (limit ?? 1)) break;
  }
  return next ? { operations, nextCursor: next } : { operations };
}
