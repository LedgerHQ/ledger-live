import { ListOperationsOptions, Operation, Page } from "@ledgerhq/coin-module-framework/api/types";
import { isValidSuiAddress } from "@mysten/sui/utils";
import { getListOperations } from "../network/sdk";
import type { SuiCoinConfig } from "../config";

export const listOperations = async (
  config: SuiCoinConfig,
  address: string,
  { cursor, order }: ListOperationsOptions,
): Promise<Page<Operation>> => {
  // gRPC pads a malformed address instead of rejecting it, so it would return an empty page.
  if (!isValidSuiAddress(address)) {
    throw new Error(`sui: invalid address ${address}`);
  }
  // FIXME ListOperationsOptions.minHeight and limit are ignored here. If Sui does not support minHeight filtering or
  //  limit, the implementation should explicitly throw when minHeight !== 0 or minHeight !== undefined (per the
  //  ListOperationsOptions contract) rather than silently ignoring it.
  const ops = await getListOperations(config, address, order ?? "asc", cursor);
  return { items: ops.items, next: ops.next || undefined };
};
