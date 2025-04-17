import { Operation, Pagination } from "@ledgerhq/coin-framework/lib/api/types";
import { getListOperations } from "../network/sdk";

export const listOperations = async <T>(
  address: string,
  _: Pagination,
): Promise<[Operation<T>[], string]> => {
  const ops = await getListOperations<T>(address);
  return [ops, ops.length ? ops[0].tx.hash : ""];
};
