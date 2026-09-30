import type { SuiClientTypes } from "@mysten/sui/client";
import { type GrpcTypes, parseGrpcTransactionResponse } from "@mysten/sui/grpc";
import { fromBase64 } from "@mysten/sui/utils";
import { toShortStructTag } from "../../utils";
import type { SuiAccumulatorEvent, SuiCommand, SuiInput, SuiTransactionResponse } from "../types";

/**
 * gRPC `ExecutedTransaction` → {@link SuiTransactionResponse}, the shape every coin-sui operation
 * parser consumes.
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

const str = (v: unknown): string => (typeof v === "string" ? v : "");

/**
 * Core `CallArg` → {@link SuiInput}, or `null` for a shape Ledger Live never reads.
 *
 * Pure inputs carry BCS bytes with no type information, so `valueType` is recovered by length —
 * u64 = 8 bytes, address = 32 — matching the GraphQL adapter exactly. Those are the only two pure
 * shapes Ledger Live produces and the only two `getOperationRecipients` matches on; other sizes
 * stay inert rather than guessing.
 */
export function toSuiInput(input: unknown): SuiInput | null {
  if (!input || typeof input !== "object") return null;
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
    switch (obj?.$kind) {
      case "ImmOrOwnedObject": {
        const o = obj.ImmOrOwnedObject as Unknown | undefined;
        return { type: "object", objectType: "immOrOwnedObject", objectId: str(o?.objectId) };
      }
      case "SharedObject": {
        const o = obj.SharedObject as Unknown | undefined;
        return {
          type: "object",
          objectType: "sharedObject",
          objectId: str(o?.objectId),
          mutable: o?.mutable === true,
        };
      }
      case "Receiving": {
        const o = obj.Receiving as Unknown | undefined;
        return { type: "object", objectType: "receiving", objectId: str(o?.objectId) };
      }
      default:
        return null;
    }
  }

  return null;
}

/** Core `Command` (`$kind`-tagged) → {@link SuiCommand}. */
export function toSuiCommand(command: unknown): SuiCommand {
  const c = (command && typeof command === "object" ? command : {}) as Unknown & {
    $kind?: string;
  };
  const kind = c.$kind ?? "Unknown";
  const moveCall = kind === "MoveCall" ? (c.MoveCall as Unknown | undefined) : undefined;
  if (moveCall && typeof moveCall === "object") {
    return {
      MoveCall: {
        package: str(moveCall.package),
        module: str(moveCall.module),
        function: str(moveCall.function),
      },
    };
  }
  return { Other: kind };
}

/**
 * Core `ExecutionError` → the plain failure string every transport exposes.
 *
 * `JSON.stringify` would surface a raw object where the GraphQL arm surfaces prose, and
 * `logic/broadcast` interpolates this value straight into the user-visible
 * `sui: broadcast execution failed: …` message. The fallback matches the GraphQL arm's
 * `extractFailureError` so a failure reads identically on both transports.
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
export function toAccumulatorEvents(
  effects: GrpcTypes.TransactionEffects | undefined,
): SuiAccumulatorEvent[] {
  const events: SuiAccumulatorEvent[] = [];
  for (const changed of effects?.changedObjects ?? []) {
    const write = changed.accumulatorWrite;
    // Without a type the write cannot be attributed to a coin; `ty: ""` would surface as an empty
    // coin type downstream.
    if (!write?.address || !write.accumulatorType || write.integerValue === undefined) continue;
    // proto AccumulatorOperation: UNKNOWN = 0, MERGE = 1, SPLIT = 2. Only the two known values are
    // accepted: mapping anything else to a default would let an absent field or a future enum
    // member be reported as a debit, inverting the sign of a balance change.
    const operation = ACCUMULATOR_OPERATIONS[write.operation as number];
    if (!operation) continue;
    events.push({
      address: write.address,
      ty: write.accumulatorType,
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
 * which keeps non-programmable payloads rather than dropping them.
 */
const INCLUDE_WITHOUT_BODY = { effects: true, events: true, balanceChanges: true } as const;

/** Proto oneof tag → PascalCase kind name; an unset kind becomes `"SystemTransaction"`. */
const toKindName = (oneofKind: string | undefined): string =>
  oneofKind ? oneofKind.charAt(0).toUpperCase() + oneofKind.slice(1) : "SystemTransaction";

export function grpcTxToSuiTransaction(
  executed: GrpcTypes.ExecutedTransaction,
): SuiTransactionResponse {
  const kind = executed.transaction?.kind?.data;
  const isProgrammable = kind?.oneofKind === "programmableTransaction";

  const parsed = parseGrpcTransactionResponse(executed, {
    include: isProgrammable ? INCLUDE : INCLUDE_WITHOUT_BODY,
  });
  const tx = (parsed.Transaction ?? parsed.FailedTransaction) as SuiClientTypes.Transaction<
    typeof INCLUDE
  >;
  const data = isProgrammable ? tx.transaction : undefined;
  const gas = tx.effects?.gasUsed;

  return {
    digest: tx.digest,
    transaction: {
      data: {
        transaction: isProgrammable
          ? {
              kind: "ProgrammableTransaction",
              inputs: (data?.inputs ?? []).map(toSuiInput).filter(i => i !== null),
              transactions: (data?.commands ?? []).map(toSuiCommand),
            }
          : { kind: "System", name: toKindName(kind?.oneofKind) },
        sender: data?.sender ?? executed.transaction?.sender ?? "",
        gasData: { owner: data?.gasData?.owner ?? undefined },
      },
    },
    effects: {
      status: tx.status.success
        ? { status: "success" }
        : { status: "failure", error: executionErrorMessage(tx.status.error) },
      gasUsed: {
        computationCost: String(gas?.computationCost ?? "0"),
        storageCost: String(gas?.storageCost ?? "0"),
        storageRebate: String(gas?.storageRebate ?? "0"),
      },
      accumulatorEvents: toAccumulatorEvents(executed.effects),
    },
    events: (tx.events ?? []).map(event => ({
      // Downstream compares against short staking-event constants.
      type: toShortStructTag(event.eventType),
      parsedJson: event.json,
    })),
    balanceChanges: (tx.balanceChanges ?? []).map(change => ({
      address: change.address,
      coinType: toShortStructTag(change.coinType),
      amount: change.amount,
    })),
    timestampMs: executed.timestamp
      ? (
          executed.timestamp.seconds * 1000n +
          BigInt(Math.floor((executed.timestamp.nanos ?? 0) / 1e6))
        ).toString()
      : null,
    checkpoint: executed.checkpoint !== undefined ? executed.checkpoint.toString() : null,
  };
}
