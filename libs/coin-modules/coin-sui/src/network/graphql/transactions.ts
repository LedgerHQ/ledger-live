/**
 * GraphQL → JSON-RPC `SuiTransactionBlockResponse` adapter. Hybrid: typed
 * fields (`digest`, `gasEffects`, `events`, `timestamp`, `checkpoint`) for
 * fixed shape; JSON blobs (`transactionJson` / `balanceChangesJson` /
 * `effectsJson`) for fields whose gRPC-proto shape downstream mappers
 * already understand.
 */
import type { SuiTransactionBlockResponse } from "@mysten/sui/jsonRpc";
import type { TransactionByDigestResult, TransactionsByAffectedAddressResult } from "./queries";
import { extractFailureError } from "./utils";

/**
 * gRPC-proto BalanceChange uses bare `address` strings; JSON-RPC wraps them in a discriminated
 * owner union. Downstream `getOperationAmount` does the union access.
 */
function normaliseBalanceChanges(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(bc => {
    if (!bc || typeof bc !== "object") return bc;
    const entry = bc as Record<string, unknown>;
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

  // gRPC-proto exposes the inner Move transaction at the top level for ProgrammableTransactionBlock —
  // match the JSON-RPC nesting downstream expects.
  const inner = (txJson.transaction ?? txJson) as Record<string, unknown>;

  return {
    digest: tx.digest,
    transaction: {
      data: {
        transaction: inner,
        sender: (txJson.sender as string) ?? "",
        gasData: txJson.gasData ?? {},
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
      type: node.contents?.type?.repr ?? "",
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
