import { Operation, Pagination } from "@ledgerhq/coin-framework/lib/api/types";
import { getListOperations } from "../network/sdk";

export const listOperations = async (
  address: string,
  { lastPagingToken, order }: Pagination,
): Promise<[Operation[], string]> => {
  const ops = await getListOperations(address, lastPagingToken, order);
  return [ops.items, ops.next || ""];
};
