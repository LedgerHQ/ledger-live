/**
 * Typed `graphql` template literal tag bound to the SUI production GraphQL
 * schema introspection. Use this everywhere we hand-write a GraphQL document
 * for `SuiGraphQLClient.query()` so that field names, args, and result shapes
 * are checked at compile time.
 *
 * Regenerate the underlying introspection with:
 *   pnpm --filter @ledgerhq/coin-sui graphql:codegen:fetch
 *
 * The introspection snapshot lives at `./introspection.json` and the
 * gql.tada-typed mirror at `./graphql-env.d.ts`.
 */
import { initGraphQLTada, type ResultOf, type VariablesOf } from "gql.tada";
import type { introspection } from "./graphql-env";

/**
 * Custom-scalar mapping. Mirrors `@mysten/sui`'s built-in `CustomScalars`
 * shape so that values come out of queries with sensible TS types instead of
 * `unknown`.
 */
type SuiScalars = {
  /** RFC3339 timestamp string. */
  DateTime: string;
  /** 0x-prefixed hex address (32 bytes). */
  SuiAddress: string;
  /** Stringified u64/u128 — large enough to overflow JS number. */
  BigInt: string;
  /** Unsigned 53-bit int — fits in JS number; SDK exposes as string for safety. */
  UInt53: string;
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
