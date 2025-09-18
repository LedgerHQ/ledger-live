import { Operation, Pagination } from "@ledgerhq/coin-framework/lib/api/types";
import { getListOperations, withApi } from "../network/sdk";

export const listOperations = async (
  address: string,
  { lastPagingToken, order }: Pagination,
): Promise<[Operation[], string]> => {
  const ops = await getListOperations(address, order ?? "asc", withApi, lastPagingToken);
  return [ops.items, ops.next || ""];
};
