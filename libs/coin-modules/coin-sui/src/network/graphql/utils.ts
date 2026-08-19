/**
 * GraphQL-specific helpers: envelope handling, GraphQL-node adapters, and drift guards.
 *
 * Transport-neutral staking maths and Move-JSON shapes live in `network/staking.ts`.
 */
import type { SuiClientTypes } from "@mysten/sui/client";
import type { StakedSuiObjectsResult } from "./queries";
import { type ExchangeRate, isStakedSuiJson, isU64Numeric, type StakedSuiJson } from "../staking";

/**
 * Envelope handler for `SuiGraphQLClient.query()`: throws on populated
 * `errors[]` (joined) or missing `data`. Shared between the read-side
 * (`sdk.graphql.ts`) and the build-side (`sui-client-adapter.ts`).
 *
 * Part 1 cleanup applied: removed `as NonNullable<T>` cast — TS narrows
 * `res.data` after the null/undefined guard on its own.
 */
export function unwrapGraphQL<T>(
  label: string,
  res: { data?: T | null; errors?: readonly { message: string }[] | null },
): NonNullable<T> {
  if (res.errors?.length) {
    throw new Error(`GraphQL ${label} failed: ${res.errors.map(e => e.message).join("; ")}`);
  }
  if (res.data === null || res.data === undefined) {
    throw new Error(`GraphQL ${label} failed: no data`);
  }
  return res.data;
}

// ----- Move type-tag normalisation ----------------------------------------

/**
 * Normalise GraphQL's long padded Move type tags to JSON-RPC short form.
 * coin-sui compares against `DEFAULT_COIN_TYPE` everywhere; long forms
 * silently miss `===` checks if any GraphQL response skips this.
 */
export function shortenCoinType(coinType: string): string {
  const m = /^0x([0-9a-fA-F]{1,64})(::.*)$/.exec(coinType);
  if (!m) return coinType;
  // Keep at least one digit so the all-zero address normalises to `0x0`.
  const trimmed = m[1].replace(/^0+/, "") || "0";
  return `0x${trimmed}${m[2]}`;
}

// ----- GraphQL stake-node validation ---------------------------------------

/** One stake node from `STAKED_SUI_OBJECTS_BY_OWNER`'s paginated `nodes`. */
export type StakeNode = NonNullable<
  NonNullable<NonNullable<StakedSuiObjectsResult["address"]>["objects"]>["nodes"]
>[number];

/** Split nodes into validated `StakedSuiJson` and a malformed-count. */
export function validateStakedSuiNodes(rawNodes: ReadonlyArray<StakeNode>): {
  items: StakedSuiJson[];
  malformed: number;
} {
  const items: StakedSuiJson[] = [];
  let malformed = 0;
  for (const node of rawNodes) {
    const json = node.contents?.json;
    if (isStakedSuiJson(json)) items.push(json);
    else if (json !== null && json !== undefined) malformed++;
  }
  return { items, malformed };
}

/** Shape returned by `address.dynamicField(...).value` — single + batched lookups. */
export type ExchangeRateAddrNode = {
  dynamicField?: {
    value?: { __typename?: string; json?: unknown } | null;
  } | null;
} | null;

/** Predicate over `unknown`, no casts. Mirrors {@link isStakedSuiJson}. */
function isExchangeRateJson(x: unknown): x is ExchangeRate {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  // Same strict u64 check as isStakedSuiJson; downstream BigInt() throws on bad strings.
  return isU64Numeric(o.sui_amount) && isU64Numeric(o.pool_token_amount);
}

/** Project an `address.dynamicField` payload to an `ExchangeRate` or null. */
export function parseExchangeRateNode(node: ExchangeRateAddrNode): ExchangeRate | null {
  if (!node) return null;
  const value = node.dynamicField?.value;
  if (value?.__typename !== "MoveValue") return null;
  if (!isExchangeRateJson(value.json)) return null;
  return { sui_amount: value.json.sui_amount, pool_token_amount: value.json.pool_token_amount };
}

// ----- Failure-error extraction from gRPC `ExecutionStatus` ---------------

function prettifyEnumKind(kind: string): string {
  return kind.toLowerCase().replace(/_+/g, " ").trim();
}

/**
 * Extract a human-readable error from the gRPC-proto `ExecutionStatus` shape carried in
 * `effectsJson`: prefer `description`, fall back to a prettified `kind` enum, then a generic placeholder.
 */
export function extractFailureError(effectsJson: Record<string, unknown>): string {
  const status = effectsJson.status;
  const err =
    status && typeof status === "object" && !Array.isArray(status)
      ? (status as Record<string, unknown>).error
      : undefined;
  if (err && typeof err === "object" && !Array.isArray(err)) {
    const e = err as Record<string, unknown>;
    if (typeof e.description === "string" && e.description.length > 0) return e.description;
    if (typeof e.kind === "string" && e.kind.length > 0) return prettifyEnumKind(e.kind);
  }
  return "transaction execution failed";
}

// ----- OpenMoveType signature projection ----------------------------------

/**
 * GraphQL `OpenMoveTypeSignature` JSON-scalar shape — opaque structured value
 * the SDK's `Transaction.build` resolver reads via `getMoveFunction`. Body is
 * a tagged union: primitive string, vector wrapper, datatype struct, or type
 * parameter index.
 */
export type OpenMoveSigJson = {
  ref?: "&" | "&mut" | null;
  body: OpenMoveSigBodyJson;
};

export type OpenMoveSigBodyJson =
  | "address"
  | "bool"
  | "u8"
  | "u16"
  | "u32"
  | "u64"
  | "u128"
  | "u256"
  | { vector: OpenMoveSigBodyJson }
  | { typeParameter: number }
  | {
      datatype: {
        package: string;
        module: string;
        type: string;
        typeParameters: OpenMoveSigBodyJson[];
      };
    };

const PRIMITIVE_KINDS = ["address", "bool", "u8", "u16", "u32", "u64", "u128", "u256"] as const;
type PrimitiveKind = (typeof PRIMITIVE_KINDS)[number];

const isPrimitiveKind = (s: string): s is PrimitiveKind =>
  (PRIMITIVE_KINDS as readonly string[]).includes(s);

/** Recursive `OpenMoveSigBodyJson` → SDK `OpenSignatureBody` projection. */
export function projectOpenMoveBody(body: unknown): SuiClientTypes.OpenSignatureBody {
  if (typeof body === "string") {
    return isPrimitiveKind(body) ? { $kind: body } : { $kind: "unknown" };
  }
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    if ("vector" in obj) {
      return { $kind: "vector", vector: projectOpenMoveBody(obj.vector) };
    }
    if ("typeParameter" in obj) {
      return { $kind: "typeParameter", index: Number(obj.typeParameter) };
    }
    if ("datatype" in obj) {
      const dt = obj.datatype as {
        package: string;
        module: string;
        type: string;
        typeParameters?: unknown[];
      };
      return {
        $kind: "datatype",
        datatype: {
          typeName: `${dt.package}::${dt.module}::${dt.type}`,
          typeParameters: (dt.typeParameters ?? []).map(projectOpenMoveBody),
        },
      };
    }
  }
  return { $kind: "unknown" };
}

const moveRefToOpenSignatureReference = (
  ref: string | null | undefined,
): "mutable" | "immutable" | null => {
  if (ref === "&mut") return "mutable";
  if (ref === "&") return "immutable";
  return null;
};

/** GraphQL `parameters[i].signature` JSON scalar → SDK `OpenSignature`. */
export function projectOpenMoveSignature(sigJson: unknown): SuiClientTypes.OpenSignature {
  const sig = sigJson as OpenMoveSigJson;
  return {
    reference: moveRefToOpenSignatureReference(sig?.ref),
    body: projectOpenMoveBody(sig?.body),
  };
}
