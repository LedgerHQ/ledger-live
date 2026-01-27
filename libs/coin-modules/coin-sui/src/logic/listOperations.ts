import { ListOperationsOptions, Operation, Page } from "@ledgerhq/coin-framework/lib/api/types";
import { getListOperations, withApi } from "../network/sdk";

export const listOperations = async (
  address: string,
  { cursor, order }: ListOperationsOptions,
): Promise<Page<Operation>> => {
  const ops = await getListOperations(address, order ?? "asc", withApi, cursor);
  return { items: ops.items, next: ops.next || undefined };
};
