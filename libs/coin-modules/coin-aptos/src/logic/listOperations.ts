import type { Operation, Pagination } from "@ledgerhq/coin-framework/api/index";

export async function listOperations(
  // eslint-disable-next-line
  address: string,
  // eslint-disable-next-line
  pagination: Pagination,
  // @ts-expect-error to be implemented
): Promise<[Operation[], number]> {
  // TODO implement aptos combine
}
