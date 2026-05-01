/**
 * Typed `graphql` template tag bound to the SUI production schema. Use it
 * for every hand-written document so fields, args, and results are
 * checked at compile time. Regenerate via
 * `pnpm --filter @ledgerhq/coin-sui graphql:codegen:fetch`; the
 * introspection snapshot lives at `./introspection.json` and the typed
 * mirror at `./graphql-env.d.ts`.
 */
import { initGraphQLTada, type ResultOf, type VariablesOf } from "gql.tada";
import type { introspection } from "./graphql-env";

/**
 * Custom-scalar mapping (mirrors `@mysten/sui`'s `CustomScalars`).
 * Verified against the live `graphql.mainnet.sui.io` endpoint:
 *   `UInt53` → number (server rejects stringified values),
 *   `BigInt` → string (avoids JS number precision loss for u64+),
 *   `DateTime` → RFC3339 string.
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
