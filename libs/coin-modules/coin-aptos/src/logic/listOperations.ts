import type { Operation, Pagination } from "@ledgerhq/coin-framework/api/index";
import { log } from "@ledgerhq/logs";

export async function listOperations(
  address: string,
  pagination: Pagination,
): Promise<[Operation[], number]> {
  log("info", "address", address);
  log("info", "pagination", pagination.limit.toString());

  return [[], 0];
}
