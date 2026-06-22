import { use } from "react";
import type {
  Account,
  TransactionCommon,
  TransactionStatusCommon,
  Operation,
} from "@ledgerhq/types-live";
import type { LLDCoinFamily } from "./types";
import { importLLDCoinFamily } from "./registry";

// Stable frozen fallback for unknown/undefined families (avoids re-render churn and mutation leaks).
// oxlint-disable-next-line typescript/no-explicit-any
const EMPTY_FAMILY = Object.freeze({}) as LLDCoinFamily<any, any, any, any>;

// Loads the family on demand via dynamic import() and suspends until resolved — needs a <Suspense>
// boundary above. use() may be called conditionally, so the undefined-name early return is safe.
export function useLLDCoinFamily<
  A extends Account,
  T extends TransactionCommon,
  TS extends TransactionStatusCommon,
  O extends Operation,
>(name: string | undefined): LLDCoinFamily<A, T, TS, O> {
  if (!name) return EMPTY_FAMILY as LLDCoinFamily<A, T, TS, O>;
  return use(importLLDCoinFamily<A, T, TS, O>(name));
}
