/**
 * GraphQL → {@link SuiTransactionResponse} adapter. Hybrid: typed fields (`digest`, `gasEffects`,
 * `events`, `timestamp`, `checkpoint`) for fixed shape; JSON blobs (`transactionJson` /
 * `balanceChangesJson` / `effectsJson`) carry gRPC-proto shapes that are validated and normalised
 * here (short struct tags, `ProgrammableTransaction` kind/inputs/commands, gas owner).
 */
import { fromBase64 } from "@mysten/sui/utils";
import type {
  SuiAccumulatorEvent,
  SuiBalanceChange,
  SuiCommand,
  SuiInput,
  SuiTransactionKind,
  SuiTransactionResponse,
} from "../types";
import type { TransactionsByAffectedAddressResult } from "./queries";
import { extractFailureError } from "./utils";
import { toShortStructTag } from "../../utils";

type ProtoRecord = Record<string, unknown>;

const asRecord = (v: unknown): ProtoRecord | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as ProtoRecord) : null;

const str = (v: unknown): string => (typeof v === "string" ? v : "");

/**
 * gRPC-proto `BalanceChange` → {@link SuiBalanceChange}. The address arrives under `address`, or
 * under `owner` as a bare string or an `{ AddressOwner }` wrapper. An entry with no resolvable
 * address, coin type or amount is dropped.
 */
function toBalanceChanges(raw: unknown): SuiBalanceChange[] {
  if (!Array.isArray(raw)) return [];
  const changes: SuiBalanceChange[] = [];
  for (const bc of raw) {
    const entry = asRecord(bc);
    if (!entry || typeof entry.coinType !== "string" || typeof entry.amount !== "string") continue;
    const owner = entry.owner;
    const address =
      typeof entry.address === "string"
        ? entry.address
        : typeof owner === "string"
          ? owner
          : asRecord(owner)?.AddressOwner;
    if (typeof address !== "string") continue;
    changes.push({ address, coinType: toShortStructTag(entry.coinType), amount: entry.amount });
  }
  return changes;
}

/**
 * `effectsJson.accumulatorEvents` → {@link SuiAccumulatorEvent}. Only `merge` and `split` are
 * accepted, matching the gRPC mapper: defaulting an absent or unknown operation would report it as
 * a debit and invert the sign of a balance change. An entry without an address, type or integer
 * value cannot be attributed and is dropped.
 */
function toAccumulatorEvents(raw: unknown): SuiAccumulatorEvent[] {
  if (!Array.isArray(raw)) return [];
  const events: SuiAccumulatorEvent[] = [];
  for (const item of raw) {
    const evt = asRecord(item);
    const integer = asRecord(evt?.value)?.integer;
    const operation = evt?.operation;
    if (
      !evt ||
      typeof evt.address !== "string" ||
      typeof evt.ty !== "string" ||
      evt.ty === "" ||
      typeof integer !== "string" ||
      (operation !== "merge" && operation !== "split")
    ) {
      continue;
    }
    events.push({ address: evt.address, ty: evt.ty, operation, value: { integer } });
  }
  return events;
}

// ----- gRPC-proto ProgrammableTransaction → SuiProgrammableTransaction -----
//
// `transactionJson` carries the gRPC-proto `Transaction` message: `kind` is a tagged object,
// commands use lowerCamel keys (`moveCall`), pure inputs are raw base64 BCS (no decoded
// `valueType`/`value`), and gas lives under `gasPayment`. Without this mapping
// `isStaking`/`isUnstaking` never match (DELEGATE ops surface as OUT), recipients come back empty
// and `getFeesPayer` reads undefined.

/**
 * proto `Input` → {@link SuiInput}, or `null` for a shape Ledger Live never reads. Pure inputs are
 * raw BCS bytes with no type info; `valueType` is recovered by length (u64 = 8 bytes, address = 32
 * bytes) — the only two pure shapes Ledger Live transactions produce and the only two downstream
 * consumers (`getOperationRecipients`) match on. Other sizes stay inert (`valueType: null`) rather
 * than guessing.
 */
function protoInputToSuiInput(raw: unknown): SuiInput | null {
  const input = asRecord(raw);
  switch (input?.kind) {
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
        objectId: str(input.objectId),
        mutable: input.mutable === true,
      };
    case "IMMUTABLE_OR_OWNED":
      return { type: "object", objectType: "immOrOwnedObject", objectId: str(input.objectId) };
    case "RECEIVING":
      return { type: "object", objectType: "receiving", objectId: str(input.objectId) };
    default:
      return null;
  }
}

/** proto `Command` (lowerCamel-keyed) → {@link SuiCommand}. */
function protoCommandToSuiCommand(raw: unknown): SuiCommand {
  const cmd = asRecord(raw) ?? {};
  const moveCall = asRecord(cmd.moveCall);
  if (moveCall) {
    return {
      MoveCall: {
        package: str(moveCall.package),
        module: str(moveCall.module),
        function: str(moveCall.function),
      },
    };
  }
  return { Other: Object.keys(cmd)[0] ?? "Unknown" };
}

/** proto enum tag (`CONSENSUS_COMMIT_PROLOGUE_V4`) → PascalCase, the form the gRPC mapper emits. */
const toKindName = (tag: string): string =>
  tag
    .toLowerCase()
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

/** proto `TransactionKind` → {@link SuiTransactionKind}; a non-programmable kind keeps its name. */
function protoTxKindToSuiKind(rawKind: unknown): SuiTransactionKind {
  const kind = asRecord(rawKind);
  if (kind?.kind !== "PROGRAMMABLE_TRANSACTION") {
    const tag = str(kind?.kind);
    return { kind: "System", name: tag ? toKindName(tag) : "SystemTransaction" };
  }
  const pt = asRecord(kind.programmableTransaction) ?? {};
  return {
    kind: "ProgrammableTransaction",
    inputs: (Array.isArray(pt.inputs) ? pt.inputs : [])
      .map(protoInputToSuiInput)
      .filter(i => i !== null),
    transactions: (Array.isArray(pt.commands) ? pt.commands : []).map(protoCommandToSuiCommand),
  };
}

/** GraphQL Transaction node — emitted by `TRANSACTIONS_BY_AFFECTED_ADDRESS`. */
export type GraphQLTransactionNode = NonNullable<
  NonNullable<TransactionsByAffectedAddressResult["transactions"]>["nodes"]
>[number];

/**
 * Project a GraphQL event node's `contents` to `{ type, parsedJson }`. `repr` arrives long-padded;
 * shortened so downstream `type ===` checks match the short struct tags.
 */
export function mapEventNodeContents(node: {
  contents?: { type?: { repr?: string | null } | null; json?: unknown } | null;
}): { type: string; parsedJson: unknown } {
  return {
    type: node.contents?.type?.repr ? toShortStructTag(node.contents.type.repr) : "",
    parsedJson: node.contents?.json ?? {},
  };
}

/**
 * Project a GraphQL `Transaction` into the {@link SuiTransactionResponse} that `network/sdk.ts`
 * mappers consume. SIP-58 accumulator events live in `effectsJson.accumulatorEvents` per the gRPC
 * proto.
 */
export function graphqlTxToSuiTransaction(tx: GraphQLTransactionNode): SuiTransactionResponse {
  const effects = tx.effects;
  const txJson = asRecord(tx.transactionJson) ?? {};
  const effectsJson = asRecord(effects?.effectsJson) ?? {};
  const gas = effects?.gasEffects?.gasSummary;
  const gasOwner = asRecord(txJson.gasPayment)?.owner;

  return {
    digest: tx.digest,
    transaction: {
      data: {
        transaction: protoTxKindToSuiKind(txJson.kind),
        sender: str(txJson.sender),
        gasData: { owner: typeof gasOwner === "string" ? gasOwner : undefined },
      },
    },
    effects: {
      // GraphQL `SUCCESS`/`FAILURE` → `success`/`failure`. Treat a missing status (null/undefined)
      // as failure rather than success so partial/indexing-lagged responses can't silently mask
      // real failures. For failures, mine the error string out of `effectsJson` (gRPC
      // `ExecutionStatus.error`).
      status:
        effects?.status === "SUCCESS"
          ? { status: "success" }
          : { status: "failure", error: extractFailureError(effectsJson) },
      gasUsed: {
        computationCost: String(gas?.computationCost ?? "0"),
        storageCost: String(gas?.storageCost ?? "0"),
        storageRebate: String(gas?.storageRebate ?? "0"),
      },
      accumulatorEvents: toAccumulatorEvents(effectsJson.accumulatorEvents),
    },
    events: (effects?.events?.nodes ?? []).map(mapEventNodeContents),
    balanceChanges: toBalanceChanges(effects?.balanceChangesJson),
    timestampMs: effects?.timestamp ? String(new Date(effects.timestamp).getTime()) : null,
    checkpoint: effects?.checkpoint?.sequenceNumber
      ? String(effects.checkpoint.sequenceNumber)
      : null,
  };
}

/**
 * A finalized Sui transaction always carries an execution `timestamp` (set when it is included
 * in a checkpoint). A node returned before the indexer has finalized it — e.g. indexing lag in
 * the moment after broadcast — comes back with a null `effects`/`timestamp`. Mapping such a node
 * via `graphqlTxToSuiTransaction` yields a bogus operation (status defaults to failure, date to
 * 1970, no sender/balance-changes). History paginators use this to skip not-yet-finalized nodes;
 * the optimistic pending op covers the UI until the next sync returns the finalized node. A real
 * on-chain failure is finalized (has a `timestamp` + `status: FAILURE`) so it is *not* skipped.
 */
export function isFinalizedTxNode(tx: GraphQLTransactionNode): boolean {
  return Boolean(tx.effects?.timestamp);
}
