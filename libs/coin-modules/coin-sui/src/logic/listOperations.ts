import { Operation, Pagination } from "@ledgerhq/coin-framework/lib/api/types";
import { getListOperations } from "../network/sdk";
// import { SuiAsset } from "../api/types";

export const listOperations = async (
  address: string,
  pagination?: Pagination & { cursor?: string },
): Promise<[Operation[], string]> => {
  const ops = await getListOperations(address, pagination?.cursor);
  return [ops, ops.length ? ops[0].tx.hash : ""];
};
