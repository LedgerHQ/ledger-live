import {
  Account,
  TransactionCommon,
  TransactionStatusCommon,
  Operation,
} from "@ledgerhq/types-live";
import generated from "./generated";
import { LLDCoinFamily } from "./types";

export function getLLDCoinFamily<
  A extends Account,
  T extends TransactionCommon,
  TS extends TransactionStatusCommon,
  O extends Operation,
>(name: string): LLDCoinFamily<A, T, TS, O> {
  const f = generated[name as keyof typeof generated];
  if (!f) {
    return {};
  }
  return f as LLDCoinFamily<A, T, TS, O>;
}
