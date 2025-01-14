import type { Transaction } from "@ledgerhq/coin-framework/api/index";

export async function craftTransaction(
  // eslint-disable-next-line
  address: string,
  // eslint-disable-next-line
  transaction: Transaction,
  // eslint-disable-next-line
  pubkey?: string,
  // @ts-expect-error to be implemented
): Promise<string> {
  // TODO implement aptos craftTransaction
}
