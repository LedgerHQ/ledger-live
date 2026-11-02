import type { AccountOperationsPage } from "@domain/entity-account-operation";
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
  blacklistedTokenIds: ReadonlySet<string>;
};

/** One `operations` page: coin module pages until `limit` operations are listed (one, without a limit), the list ends, or the budget is spent. */
export async function readOperationsPage(
  api: CoinModuleOperationsApi,
  { currencyId, subject, cursor, limit, blacklistedTokenIds }: PageRequest,
): Promise<AccountOperationsPage> {
  const listed: ListedOperation[] = [];
  let next = cursor;
  for (let read = 0; read < MAX_PAGES_PER_READ; read++) {
    const from = next;
    const page = await api.listOperations(subject, { cursor: from, limit });
    listed.push(...(await listedOperationsOf(currencyId, page.items, api, blacklistedTokenIds)));
    // A cursor that does not advance would page forever: the list ends there.
    next = page.next && page.next !== from ? page.next : undefined;
    if (!next || listed.length >= (limit ?? 1)) break;
  }
  const operations = toAccountOperations(currencyId, subject, listed);
  return next ? { operations, nextCursor: next } : { operations };
}
