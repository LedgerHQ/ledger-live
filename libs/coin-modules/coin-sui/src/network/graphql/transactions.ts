/**
 * GraphQL → JSON-RPC `SuiTransactionBlockResponse` adapter. Hybrid: typed
 * fields (`digest`, `gasEffects`, `events`, `timestamp`, `checkpoint`) for
 * fixed shape; JSON blobs (`transactionJson` / `balanceChangesJson` /
 * `effectsJson`) carry gRPC-proto shapes that are normalised here to the
 * JSON-RPC forms downstream mappers expect (short struct tags, wrapped
 * owners, `ProgrammableTransaction` kind/inputs/commands, `gasData`).
 */
import type { SuiTransactionBlockResponse } from "@mysten/sui/jsonRpc";
import { fromBase64 } from "@mysten/sui/utils";
import type { TransactionByDigestResult, TransactionsByAffectedAddressResult } from "./queries";
import { extractFailureError } from "./utils";
import { toShortStructTag } from "../../utils";

/**
 * gRPC-proto BalanceChange uses bare `address` strings; JSON-RPC wraps them in a discriminated
 * owner union. Downstream `getOperationAmount` does the union access.
 */
function normaliseBalanceChanges(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(bc => {
    if (!bc || typeof bc !== "object") return bc;
    const rawEntry = bc as Record<string, unknown>;
    const entry: Record<string, unknown> =
      typeof rawEntry.coinType === "string"
        ? { ...rawEntry, coinType: toShortStructTag(rawEntry.coinType) }
        : rawEntry;
    const owner = entry.owner;
    // Already wrapped (JSON-RPC shape) — pass through.
    if (owner && typeof owner === "object" && !Array.isArray(owner)) return entry;
    // Bare string owner from gRPC proto — wrap as AddressOwner.
    if (typeof owner === "string") {
      return { ...entry, owner: { AddressOwner: owner } };
    }
    // Some gRPC variants surface the address under `address` instead of `owner`.
    if (typeof entry.address === "string") {
      return { ...entry, owner: { AddressOwner: entry.address } };
    }
    return entry;
  });
}

// ----- gRPC-proto ProgrammableTransaction → JSON-RPC shape ------------------
//
// `transactionJson` carries the gRPC-proto `Transaction` message, whose shape differs from the
// JSON-RPC one everywhere downstream mappers look: `kind` is a tagged object (not a string),
// commands use lowerCamel keys (`moveCall` vs `MoveCall`), pure inputs are raw base64 BCS (no
// decoded `valueType`/`value`), and gas lives under `gasPayment` (not `gasData`). Without this
// mapping `isStaking`/`isUnstaking` never match (DELEGATE ops surface as OUT), recipients come
// back empty and `getFeesPayer` reads undefined.

type ProtoRecord = Record<string, unknown>;

/** proto `Argument` → JSON-RPC argument: `"GasCoin" | {Input} | {Result} | {NestedResult}`. */
function protoArgToJsonRpc(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const arg = raw as ProtoRecord;
  switch (arg.kind) {
    case "GAS":
      return "GasCoin";
    case "INPUT":
      return { Input: arg.input };
    case "RESULT":
      return typeof arg.subresult === "number"
        ? { NestedResult: [arg.result, arg.subresult] }
        : { Result: arg.result };
    default:
      return raw;
  }
}

/**
 * proto `Input` → JSON-RPC `SuiCallArg`. Pure inputs are raw BCS bytes with no type info; the
 * JSON-RPC `valueType` is recovered by length (u64 = 8 bytes, address = 32 bytes) — the only two
 * pure shapes Ledger Live transactions produce and the only two downstream consumers
 * (`getOperationRecipients`, `extractStakingEventDetails`) match on. Other sizes stay inert
 * (`valueType: null`) rather than guessing.
 */
function protoInputToJsonRpc(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const input = raw as ProtoRecord;
  switch (input.kind) {
    case "PURE": {
      if (typeof input.pure !== "string") return { type: "pure", valueType: null, value: null };
      const bytes = fromBase64(input.pure);
      if (bytes.length === 8) {
        const value = new DataView(bytes.buffer, bytes.byteOffset, 8).getBigUint64(0, true);
        return { type: "pure", valueType: "u64", value: value.toString() };
      }
      if (bytes.length === 32) {
        const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
        return { type: "pure", valueType: "address", value: `0x${hex}` };
      }
      return { type: "pure", valueType: null, value: input.pure };
    }
    case "SHARED":
      return {
        type: "object",
        objectType: "sharedObject",
        objectId: input.objectId,
        initialSharedVersion: input.version,
        mutable: input.mutable,
      };
    case "IMMUTABLE_OR_OWNED":
      return {
        type: "object",
        objectType: "immOrOwnedObject",
        objectId: input.objectId,
        version: input.version,
        digest: input.digest,
      };
    case "RECEIVING":
      return {
        type: "object",
        objectType: "receiving",
        objectId: input.objectId,
        version: input.version,
        digest: input.digest,
      };
    default:
      return raw;
  }
}

/** `(Array.isArray(v) ? v : []).map(protoArgToJsonRpc)` — proto arg list → JSON-RPC args. */
const protoArgList = (v: unknown): unknown[] => (Array.isArray(v) ? v : []).map(protoArgToJsonRpc);

/**
 * Per-command mappers keyed by the proto's lowerCamel command tag. Each receives the command's
 * inner object (`cmd.<tag>`) and returns the PascalCase JSON-RPC `SuiTransaction` shape.
 */
const PROTO_COMMAND_MAPPERS: Record<string, (cmd: ProtoRecord) => unknown> = {
  moveCall: c => ({
    MoveCall: {
      package: c.package,
      module: c.module,
      function: c.function,
      ...(Array.isArray(c.typeArguments) ? { type_arguments: c.typeArguments } : {}),
      arguments: protoArgList(c.arguments),
    },
  }),
  splitCoins: c => ({ SplitCoins: [protoArgToJsonRpc(c.coin), protoArgList(c.amounts)] }),
  transferObjects: c => ({
    TransferObjects: [protoArgList(c.objects), protoArgToJsonRpc(c.address)],
  }),
  mergeCoins: c => ({ MergeCoins: [protoArgToJsonRpc(c.coin), protoArgList(c.coinsToMerge)] }),
  makeMoveVector: c => ({ MakeMoveVec: [c.elementType ?? null, protoArgList(c.elements)] }),
};

/** proto `Command` (lowerCamel-keyed) → JSON-RPC `SuiTransaction` (PascalCase-keyed). */
function protoCommandToJsonRpc(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const cmd = raw as ProtoRecord;
  for (const [tag, mapper] of Object.entries(PROTO_COMMAND_MAPPERS)) {
    const inner = cmd[tag];
    if (inner && typeof inner === "object") return mapper(inner as ProtoRecord);
  }
  return raw;
}

/**
 * proto `TransactionKind` → JSON-RPC `ProgrammableTransaction` block, or `null` when
 * `transactionJson` is not proto-shaped (already-JSON-RPC fixtures pass through untouched).
 */
function protoTxKindToJsonRpc(rawKind: unknown): ProtoRecord | null {
  if (!rawKind || typeof rawKind !== "object") return null;
  const kind = rawKind as ProtoRecord;
  if (kind.kind !== "PROGRAMMABLE_TRANSACTION") return null;
  const pt = (kind.programmableTransaction ?? {}) as ProtoRecord;
  return {
    kind: "ProgrammableTransaction",
    inputs: (Array.isArray(pt.inputs) ? pt.inputs : []).map(protoInputToJsonRpc),
    transactions: (Array.isArray(pt.commands) ? pt.commands : []).map(protoCommandToJsonRpc),
  };
}

/** proto `gasPayment` → JSON-RPC `gasData` (`getFeesPayer` reads `gasData.owner`). */
function protoGasPaymentToGasData(raw: unknown): ProtoRecord {
  if (!raw || typeof raw !== "object") return {};
  const gp = raw as ProtoRecord;
  return {
    payment: (Array.isArray(gp.objects) ? gp.objects : []).map(obj => {
      const o = obj as ProtoRecord;
      return { objectId: o.objectId, version: String(o.version), digest: o.digest };
    }),
    owner: gp.owner,
    price: gp.price,
    budget: gp.budget,
  };
}

/** GraphQL Transaction node — both single and paginated query share this shape. */
export type GraphQLTransactionNode =
  | NonNullable<TransactionByDigestResult["transaction"]>
  | NonNullable<NonNullable<TransactionsByAffectedAddressResult["transactions"]>["nodes"]>[number];

/**
 * Project a GraphQL `Transaction` into the JSON-RPC `SuiTransactionBlockResponse` shape that
 * `network/sdk.ts` mappers consume. Only fields downstream code reads are populated; the rest
 * carry neutral defaults to satisfy the union. SIP-58 accumulator events live in
 * `effectsJson.accumulatorEvents` per the gRPC proto.
 */
export function graphqlTxToJsonRpcResponse(
  tx: GraphQLTransactionNode,
): SuiTransactionBlockResponse {
  const effects = tx.effects;
  const txJson = (tx.transactionJson ?? {}) as Record<string, unknown>;
  const effectsJson = (effects?.effectsJson ?? {}) as Record<string, unknown>;
  const gas = effects?.gasEffects?.gasSummary;

  // gRPC-proto wraps the Move transaction in a tagged `kind` object — map it to the JSON-RPC
  // `ProgrammableTransaction` block. Non-proto payloads keep the legacy unwrapping (the inner
  // Move transaction at the top level, or nested under `.transaction`).
  const inner =
    protoTxKindToJsonRpc(txJson.kind) ??
    ((txJson.transaction ?? txJson) as Record<string, unknown>);

  return {
    digest: tx.digest,
    transaction: {
      data: {
        transaction: inner,
        sender: (txJson.sender as string) ?? "",
        gasData: txJson.gasData ?? protoGasPaymentToGasData(txJson.gasPayment),
        messageVersion: "v1",
      },
      txSignatures: [],
    },
    effects: {
      messageVersion: "v1",
      // GraphQL `SUCCESS`/`FAILURE` → JSON-RPC `success`/`failure`. Treat a
      // missing status (null/undefined) as failure rather than success so
      // partial/indexing-lagged responses can't silently mask real failures.
      // For failures, mine the error string out of `effectsJson` (gRPC `ExecutionStatus.error`).
      status:
        effects?.status === "SUCCESS"
          ? { status: "success" }
          : { status: "failure", error: extractFailureError(effectsJson) },
      executedEpoch: "0",
      gasUsed: {
        computationCost: gas?.computationCost ?? "0",
        storageCost: gas?.storageCost ?? "0",
        storageRebate: gas?.storageRebate ?? "0",
        nonRefundableStorageFee: gas?.nonRefundableStorageFee ?? "0",
      },
      transactionDigest: tx.digest,
      gasObject: {
        owner: { AddressOwner: "0x0" },
        reference: { objectId: "0x0", version: "0", digest: "" },
      },
      accumulatorEvents: effectsJson.accumulatorEvents ?? [],
    },
    events: (effects?.events?.nodes ?? []).map(node => ({
      id: { txDigest: tx.digest, eventSeq: "0" },
      packageId: "0x0",
      transactionModule: "",
      sender: "",
      type: node.contents?.type?.repr ? toShortStructTag(node.contents.type.repr) : "",
      parsedJson: node.contents?.json ?? {},
      bcs: "",
      bcsEncoding: "base64",
    })),
    balanceChanges: normaliseBalanceChanges(effects?.balanceChangesJson),
    timestampMs: effects?.timestamp ? String(new Date(effects.timestamp).getTime()) : null,
    checkpoint: effects?.checkpoint?.sequenceNumber
      ? String(effects.checkpoint.sequenceNumber)
      : null,
  } as unknown as SuiTransactionBlockResponse;
}

/**
 * A finalized Sui transaction always carries an execution `timestamp` (set when it is included
 * in a checkpoint). A node returned before the indexer has finalized it — e.g. indexing lag in
 * the moment after broadcast — comes back with a null `effects`/`timestamp`. Mapping such a node
 * via `graphqlTxToJsonRpcResponse` yields a bogus operation (status defaults to failure, date to
 * 1970, no sender/balance-changes). History paginators use this to skip not-yet-finalized nodes;
 * the optimistic pending op covers the UI until the next sync returns the finalized node. A real
 * on-chain failure is finalized (has a `timestamp` + `status: FAILURE`) so it is *not* skipped.
 */
export function isFinalizedTxNode(tx: GraphQLTransactionNode): boolean {
  return Boolean(tx.effects?.timestamp);
}
