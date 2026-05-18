/**
 * Typed `graphql` template tag bound to the SUI production schema. Introspection
 * lives at `./introspection.json` (mirrored at `./graphql-env.d.ts`); regenerate via codegen.
 */
import { initGraphQLTada } from "gql.tada";
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

export type { ResultOf, VariablesOf } from "gql.tada";
