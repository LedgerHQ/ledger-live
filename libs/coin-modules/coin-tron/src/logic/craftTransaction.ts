import { type Transaction } from "@ledgerhq/coin-framework/api/index";

export function craftTransaction(
  _address: string,
  _transaction: Transaction,
  _pubkey?: string,
): Promise<string> {
  throw Error("Not implemented yet");
}
