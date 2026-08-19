import type { SuiClientTypes } from "@mysten/sui/client";
import { type GrpcTypes, parseGrpcTransactionResponse } from "@mysten/sui/grpc";
import type { SuiTransactionBlockResponse } from "@mysten/sui/jsonRpc";
import { fromBase64 } from "@mysten/sui/utils";
import { toShortStructTag } from "../../utils";

/**
 * gRPC `ExecutedTransaction` → legacy `SuiTransactionBlockResponse`, the shape every coin-sui
 * operation parser consumes.
 *
 * The proto is normalised by the SDK first (`parseGrpcTransactionResponse`), so this file maps
 * from the transport-agnostic Core types rather than unpicking proto oneofs and enums by hand —
 * the GraphQL adapter's `proto*` helpers can't be reused because they parse GraphQL's *JSON
 * rendering* of proto (`kind: "PROGRAMMABLE_TRANSACTION"` plus a sibling field) while protobuf-ts
 * uses a real oneof.
 *
 * Some fields are read from the raw proto instead, because Core omits them:
 *   - `checkpoint` / `timestamp` — absent from `SuiClientTypes.Transaction` entirely.
 *   - the transaction kind and sender — needed to classify system transactions before decoding,
 *     see {@link INCLUDE_WITHOUT_BODY}.
 *   - accumulator writes — see {@link toAccumulatorEvents}.
 */

type Unknown = Record<string, unknown>;

/** Core `Argument` → JSON-RPC argument: `"GasCoin" | {Input} | {Result} | {NestedResult}`. */
export function argToJsonRpc(arg: unknown): unknown {
  if (!arg || typeof arg !== "object") return arg;
  const a = arg as Unknown & { $kind?: string };
  switch (a.$kind) {
    case "GasCoin":
      return "GasCoin";
    case "Input":
      return { Input: a.Input };
    case "Result":
      return { Result: a.Result };
    case "NestedResult":
      return { NestedResult: a.NestedResult };
    default:
      return arg;
  }
}

const argList = (v: unknown): unknown[] => (Array.isArray(v) ? v : []).map(argToJsonRpc);

/**
 * Object versions are numeric strings in the JSON-RPC shape, and proto leaves unset scalars absent.
 * Coercing unconditionally would emit the literal `"undefined"`, so omit the key instead — matching
 * the GraphQL arm, which passes a missing version straight through as `undefined`.
 *
 * BCS types a u64 version as `string | number | bigint`; the same omission covers any other shape,
 * which would otherwise stringify to `"[object Object]"` and read downstream as a real version.
 */
const optionalVersion = (key: string, value: unknown): Unknown => {
  const isU64 = typeof value === "string" || typeof value === "number" || typeof value === "bigint";
  return isU64 ? { [key]: String(value) } : {};
};

/**
 * Core `CallArg` → JSON-RPC `SuiCallArg`.
 *
 * Pure inputs carry BCS bytes with no type information, so `valueType` is recovered by length —
 * u64 = 8 bytes, address = 32 — matching the GraphQL adapter exactly. Those are the only two pure
 * shapes Ledger Live produces and the only two `getOperationRecipients` matches on; other sizes
 * stay inert rather than guessing.
 */
export function inputToJsonRpc(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const i = input as Unknown & { $kind?: string };

  if (i.$kind === "Pure") {
    const bytes64 = (i.Pure as { bytes?: string } | undefined)?.bytes;
    if (typeof bytes64 !== "string") return { type: "pure", valueType: null, value: null };
    const bytes = fromBase64(bytes64);
    if (bytes.length === 8) {
      const value = new DataView(bytes.buffer, bytes.byteOffset, 8).getBigUint64(0, true);
      return { type: "pure", valueType: "u64", value: value.toString() };
    }
    if (bytes.length === 32) {
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
      return { type: "pure", valueType: "address", value: `0x${hex}` };
    }
    return { type: "pure", valueType: null, value: bytes64 };
  }

  if (i.$kind === "Object") {
    const obj = i.Object as (Unknown & { $kind?: string }) | undefined;
    const immOrOwned = obj?.ImmOrOwnedObject as Unknown | undefined;
    const shared = obj?.SharedObject as Unknown | undefined;
    const receiving = obj?.Receiving as Unknown | undefined;
    switch (obj?.$kind) {
      case "ImmOrOwnedObject":
        return {
          type: "object",
          objectType: "immOrOwnedObject",
          objectId: immOrOwned?.objectId,
          ...optionalVersion("version", immOrOwned?.version),
          digest: immOrOwned?.digest,
        };
      case "SharedObject":
        return {
          type: "object",
          objectType: "sharedObject",
          objectId: shared?.objectId,
          ...optionalVersion("initialSharedVersion", shared?.initialSharedVersion),
          mutable: shared?.mutable,
        };
      case "Receiving":
        return {
          type: "object",
          objectType: "receiving",
          objectId: receiving?.objectId,
          ...optionalVersion("version", receiving?.version),
          digest: receiving?.digest,
        };
      default:
        return input;
    }
  }

  return input;
}

/** Core `Command` (`$kind`-tagged) → JSON-RPC `SuiTransaction` (PascalCase-keyed). */
const COMMAND_MAPPERS: Record<string, (cmd: Unknown) => unknown> = {
  MoveCall: c => ({
    MoveCall: {
      package: c.package,
      module: c.module,
      function: c.function,
      ...(Array.isArray(c.typeArguments) ? { type_arguments: c.typeArguments } : {}),
      arguments: argList(c.arguments),
    },
  }),
  SplitCoins: c => ({ SplitCoins: [argToJsonRpc(c.coin), argList(c.amounts)] }),
  TransferObjects: c => ({ TransferObjects: [argList(c.objects), argToJsonRpc(c.address)] }),
  MergeCoins: c => ({ MergeCoins: [argToJsonRpc(c.destination), argList(c.sources)] }),
  MakeMoveVec: c => ({ MakeMoveVec: [c.type ?? null, argList(c.elements)] }),
};

export function commandToJsonRpc(command: unknown): unknown {
  if (!command || typeof command !== "object") return command;
  const c = command as Unknown & { $kind?: string };
  const mapper = c.$kind ? COMMAND_MAPPERS[c.$kind] : undefined;
  const inner = c.$kind ? c[c.$kind] : undefined;
  return mapper && inner && typeof inner === "object" ? mapper(inner as Unknown) : command;
}

/**
 * Core `ExecutionError` → the plain failure string every transport exposes.
 *
 * `JSON.stringify` would surface a raw object where the GraphQL arm surfaces prose, and
 * `logic/broadcast` interpolates this value straight into the user-visible
 * `sui: broadcast execution failed: …` message. The fallback matches the GraphQL arm's
 * `extractFailureError` so a failure reads identically on all three transports.
 */
export function executionErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as { message?: unknown; $kind?: unknown };
    if (typeof e.message === "string" && e.message.length > 0) return e.message;
    if (typeof e.$kind === "string" && e.$kind.length > 0) return e.$kind;
  }
  return "transaction execution failed";
}

const ACCUMULATOR_OPERATIONS: Record<number, "merge" | "split"> = { 1: "merge", 2: "split" };

/**
 * SIP-58 accumulator writes, read from the raw proto because Core discards their contents: its
 * `ChangedObject` records `outputState: "AccumulatorWriteV1"` but drops the address, type, value
 * and operation. `getUnifiedBalanceChanges` needs all four to surface deposits into address
 * balances — without them incoming SIP-58 transfers would silently vanish from history.
 */
export function toAccumulatorEvents(effects: GrpcTypes.TransactionEffects | undefined): unknown[] {
  const events: unknown[] = [];
  for (const changed of effects?.changedObjects ?? []) {
    const write = changed.accumulatorWrite;
    if (!write?.address || write.integerValue === undefined) continue;
    // proto AccumulatorOperation: UNKNOWN = 0, MERGE = 1, SPLIT = 2. Only the two known values are
    // accepted: mapping anything else to a default would let an absent field or a future enum
    // member be reported as a debit, inverting the sign of a balance change.
    const operation = ACCUMULATOR_OPERATIONS[write.operation as number];
    if (!operation) continue;
    events.push({
      address: write.address,
      ty: write.accumulatorType ?? "",
      operation,
      value: { integer: write.integerValue.toString() },
    });
  }
  return events;
}

const INCLUDE = {
  transaction: true,
  effects: true,
  events: true,
  balanceChanges: true,
} as const;

/**
 * Same as {@link INCLUDE} minus the transaction body.
 *
 * `parseGrpcTransactionResponse` throws "Only programmable transactions are supported" when asked
 * to decode a system transaction (`ConsensusCommitPrologue`, `ChangeEpoch`, …), and every
 * checkpoint contains at least one. Effects, events and balance changes still parse, so system
 * transactions are decoded without the body and keep their kind name — mirroring the GraphQL arm,
 * which passes non-programmable payloads through untouched rather than dropping them.
 */
const INCLUDE_WITHOUT_BODY = { effects: true, events: true, balanceChanges: true } as const;

/** Proto oneof tag → JSON-RPC-style kind name; an unset kind becomes `"SystemTransaction"`. */
const toKindName = (oneofKind: string | undefined): string =>
  oneofKind ? oneofKind.charAt(0).toUpperCase() + oneofKind.slice(1) : "SystemTransaction";

export function grpcTxToJsonRpcResponse(
  executed: GrpcTypes.ExecutedTransaction,
): SuiTransactionBlockResponse {
  const kind = executed.transaction?.kind?.data;
  const isProgrammable = kind?.oneofKind === "programmableTransaction";

  const parsed = parseGrpcTransactionResponse(executed, {
    include: isProgrammable ? INCLUDE : INCLUDE_WITHOUT_BODY,
  });
  const tx = (parsed.Transaction ?? parsed.FailedTransaction) as SuiClientTypes.Transaction<
    typeof INCLUDE
  >;
  const digest = tx.digest;
  const data = isProgrammable ? tx.transaction : undefined;
  const gas = tx.effects?.gasUsed;

  return {
    digest,
    transaction: {
      data: {
        transaction: isProgrammable
          ? {
              kind: "ProgrammableTransaction",
              inputs: (data?.inputs ?? []).map(inputToJsonRpc),
              transactions: (data?.commands ?? []).map(commandToJsonRpc),
            }
          : { kind: toKindName(kind?.oneofKind) },
        sender: data?.sender ?? executed.transaction?.sender ?? "",
        gasData: data?.gasData,
        messageVersion: "v1",
      },
      txSignatures: tx.signatures ?? [],
    },
    effects: {
      messageVersion: "v1",
      status: tx.status.success
        ? { status: "success" }
        : { status: "failure", error: executionErrorMessage(tx.status.error) },
      executedEpoch: tx.epoch ?? "0",
      gasUsed: {
        computationCost: String(gas?.computationCost ?? "0"),
        storageCost: String(gas?.storageCost ?? "0"),
        storageRebate: String(gas?.storageRebate ?? "0"),
        nonRefundableStorageFee: String(gas?.nonRefundableStorageFee ?? "0"),
      },
      transactionDigest: digest,
      // Neutral filler, matching the GraphQL adapter: `getFeesPayer` reads `gasData.owner`, and no
      // consumer reads `effects.gasObject`.
      gasObject: {
        owner: { AddressOwner: "0x0" },
        reference: { objectId: "0x0", version: "0", digest: "" },
      },
      accumulatorEvents: toAccumulatorEvents(executed.effects),
    },
    events: (tx.events ?? []).map(event => ({
      id: { txDigest: digest, eventSeq: "0" },
      packageId: event.packageId,
      transactionModule: event.module,
      sender: event.sender,
      // Downstream compares against short staking-event constants.
      type: toShortStructTag(event.eventType),
      parsedJson: event.json,
      bcs: "",
      bcsEncoding: "base64",
    })),
    balanceChanges: (tx.balanceChanges ?? []).map(change => ({
      coinType: toShortStructTag(change.coinType),
      owner: { AddressOwner: change.address },
      amount: change.amount,
    })),
    timestampMs: executed.timestamp
      ? (
          executed.timestamp.seconds * 1000n +
          BigInt(Math.floor((executed.timestamp.nanos ?? 0) / 1e6))
        ).toString()
      : null,
    checkpoint: executed.checkpoint !== undefined ? executed.checkpoint.toString() : null,
  } as unknown as SuiTransactionBlockResponse;
}
