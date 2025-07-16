import { Operation, Pagination } from "@ledgerhq/coin-framework/lib/api/types";
import { getListOperations } from "../network/sdk";
import { SuiAsset } from "../api/types";

export const listOperations = async (
  address: string,
  { cursor }: Pagination & { cursor?: string },
): Promise<[Operation<SuiAsset>[], string]> => {
  const ops = await getListOperations(address, cursor);
  return [ops, ops.length ? ops[0].tx.hash : ""];
};
