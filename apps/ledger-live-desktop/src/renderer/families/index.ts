/**
 * Guard: mark that the families barrel (and thus all family UIs + generated) has loaded.
 * Used by tests to assert heavy load is deferred (see heavyLoadGuards.test.ts).
 */
if (typeof globalThis !== "undefined") {
  Object.defineProperty(globalThis, "__LEDGER_FAMILIES_BARREL_LOADED__", { value: true });
}

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
