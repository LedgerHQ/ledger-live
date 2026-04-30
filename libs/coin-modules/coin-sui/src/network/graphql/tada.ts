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
 *
 * Verified against the live `graphql.mainnet.sui.io` endpoint:
 *   - `UInt53` is sent and received as a JSON number (the server rejects
 *     stringified values as `Expected input type "UInt53", found "100"`).
 *   - `BigInt` is delivered as a string to dodge JS number precision loss
 *     for u64+ values.
 *   - `DateTime` arrives as an RFC3339 timestamp string.
 */
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
