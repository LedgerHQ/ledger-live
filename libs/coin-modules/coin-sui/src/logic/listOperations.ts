import { ListOperationsOptions, Operation, Page } from "@ledgerhq/coin-framework/lib/api/types";
import { getListOperations, withApi } from "../network/sdk";

export const listOperations = async (
  address: string,
  { cursor, order }: ListOperationsOptions,
): Promise<Page<Operation>> => {
  // FIXME ListOperationsOptions.minHeight and limit are ignored here. If Sui does not support minHeight filtering or
  //  limit, the implementation should explicitly throw when minHeight !== 0 or minHeight !== undefined (per the
  //  ListOperationsOptions contract) rather than silently ignoring it.
  const ops = await getListOperations(address, order ?? "asc", withApi, cursor);
  return { items: ops.items, next: ops.next || undefined };
};
