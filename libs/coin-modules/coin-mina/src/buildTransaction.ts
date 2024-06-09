import { log } from "@ledgerhq/logs";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "./types";

export const buildTransaction = async (
  a: Account,
  t: Transaction,
  _publicKey: string,
): Promise<any> => {
  try {
    return {};
  } catch (e) {
    log("Mina", "Error building transaction", {
      error: e,
      transaction: t,
      account: a,
    });
    throw e;
  }
};
