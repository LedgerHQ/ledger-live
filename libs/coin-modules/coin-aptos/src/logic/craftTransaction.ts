import type { Transaction } from "@ledgerhq/coin-framework/api/index";
import { log } from "@ledgerhq/logs";

export async function craftTransaction(
  address: string,
  transaction: Transaction,
  pubkey?: string,
): Promise<string> {
  log("info", "address", address);
  log("info", "transaction", transaction.amount.toString());
  log("info", "pubkey", pubkey);

  return "";
}
