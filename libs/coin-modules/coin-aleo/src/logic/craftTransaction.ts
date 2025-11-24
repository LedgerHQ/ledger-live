import type { CraftedTransaction } from "@ledgerhq/coin-framework/api/types";

export async function craftTransaction(
  _account: unknown,
  _transaction: unknown,
): Promise<CraftedTransaction> {
  throw new Error("craftTransaction is not supported");
}
