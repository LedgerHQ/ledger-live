import { Account, TransactionCommon, TransactionStatusCommon } from "@ledgerhq/types-live";
import generated from "./generated";
import { LLDCoinFamily } from "./types";

export function getLLDCoinFamily<
  A extends Account,
  T extends TransactionCommon,
  TS extends TransactionStatusCommon,
>(name: string): LLDCoinFamily<A, T, TS> {
  const f = generated[name as keyof typeof generated];
  if (!f) {
    return {};
  }
  return f as LLDCoinFamily<A, T, TS>;
}
