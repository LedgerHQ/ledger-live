/**
 * Typed `graphql` template tag bound to the SUI production schema. Use for
 * every hand-written document so fields, args, and results are checked at
 * compile time. Introspection lives at `./introspection.json`, typed mirror
 * at `./graphql-env.d.ts`; regenerate via the `graphql:codegen:fetch` script.
 */
import { initGraphQLTada, type ResultOf, type VariablesOf } from "gql.tada";
import type { introspection } from "./graphql-env";

/** Custom-scalar mapping; mirrors `@mysten/sui`'s `CustomScalars`, verified against live mainnet. */
type SuiScalars = {
  /** RFC3339 timestamp string. */
  DateTime: string;
  /** 0x-prefixed hex address (32 bytes). */
  SuiAddress: string;
  /** Stringified u64/u128 — large enough to overflow JS number. */
  BigInt: string;
  /** Unsigned 53-bit int — wire format is a JSON number on both directions. */
  UInt53: number;
  /** Base64-encoded bytes. */
  Base64: string;
  /** Arbitrary JSON value. */
  JSON: unknown;
};

export const graphql = initGraphQLTada<{
  introspection: introspection;
  scalars: SuiScalars;
}>();

export type { ResultOf, VariablesOf };
