import {
  AccountTransaction,
  Cursor,
  Direction,
  Operation,
  Page,
  Pagination,
} from "@ledgerhq/coin-framework/lib/api/types";
import { getListOperations, withApi } from "../network/sdk";

export const listOperations = async (
  address: string,
  { lastPagingToken, order }: Pagination,
): Promise<[Operation[], string]> => {
  const ops = await getListOperations(address, order ?? "asc", withApi, lastPagingToken);
  return [ops.items, ops.next || ""];
};

export const getTransactions = async (
  address: string,
  direction?: Direction,
  minHeight?: number,
  maxHeight?: number,
  cursor?: Cursor,
): Promise<Page<AccountTransaction>> => {
  // TODO
  throw new Error("Not implemented");
};
