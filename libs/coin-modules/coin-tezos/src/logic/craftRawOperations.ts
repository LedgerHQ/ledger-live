import { type MichelsonV1Expression, type OperationContents, OpKind } from "@taquito/rpc";
import { type Estimate, type ParamsWithKind } from "@taquito/taquito";
import {
  getPkhfromPk,
  validateAddress,
  validateKeyHash,
  validatePublicKey,
  ValidationResult,
} from "@taquito/utils";
import coinConfig from "../config";
import { UnsupportedOperationKind } from "../types/errors";
import { createMockSigner, normalizePublicKeyForAddress } from "../utils";
import { rawEncode } from "./craftTransaction";
import { estimateRevealLimits } from "./estimateRevealLimits";
import { getTezosToolkit } from "./tezosToolkit";

/**
 * Partial Tezos operation contents: RPC operation contents without `source`,
 * `counter` or `branch`, and with optional `fee`/`gas_limit`/`storage_limit`. This
 * module fills the missing fields (`source`, a sequential `counter`, and — when
 * absent — `fee`/`gas`/`storage` via estimation). Supports `transaction` (transfers
 * and contract calls) and `delegation`; other kinds raise UnsupportedOperationKind.
 */
export type PartialTezosTransactionOperation = {
  kind: "transaction";
  destination: string;
  amount: string;
  parameters?: { entrypoint: string; value: MichelsonV1Expression };
  fee?: string;
  gas_limit?: string;
  storage_limit?: string;
};
export type PartialTezosDelegationOperation = {
  kind: "delegation";
  delegate?: string;
  fee?: string;
  gas_limit?: string;
  storage_limit?: string;
};
export type PartialTezosOperation =
  | PartialTezosTransactionOperation
  | PartialTezosDelegationOperation;

type ResolvedLimits = { fee: string; gasLimit: string; storageLimit: string };

/**
 * Craft a forged (but unsigned) Tezos operation from a JSON-serialized array of
 * partial operation contents ({@link PartialTezosOperation}).
 *
 * Fills the fields a caller cannot specify up front: `source`, a sequential `counter`
 * starting at `sequence`, and any missing `fee`/`gas_limit`/`storage_limit` (estimated
 * against the node). Prepends a REVEAL when the sender's manager key is not yet
 * revealed on-chain.
 *
 * Returns the `0x03`-watermarked forged hex produced by {@link rawEncode} — the same
 * format the structured `craft()` path returns and broadcasts, so the existing
 * `signer.signTransaction` + `combine` + broadcast path applies to it unchanged.
 */
export async function craftRawOperations(
  rawTransaction: string,
  sender: string,
  publicKey: string,
  sequence: bigint,
): Promise<string> {
  if (sequence < 0n || sequence > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("craftRawOperations: sequence is out of the safe integer range");
  }
  if (!isImplicitAddress(sender)) {
    throw new Error("craftRawOperations: `sender` must be a valid implicit account address");
  }
  const operations = parseOperations(rawTransaction);

  const tezosToolkit = getTezosToolkit();
  const normalizedPk = normalizePublicKeyForAddress(publicKey, sender);
  // Mock signer lets Taquito estimate without a connected device.
  tezosToolkit.setProvider({ signer: createMockSigner(sender, normalizedPk ?? "") });

  const feesConfig = coinConfig.getCoinConfig().fees;
  const minFees = feesConfig.minFees;

  let counter = Number(sequence);
  const contents: OperationContents[] = [];

  // A manager key that is not yet revealed on-chain requires a leading REVEAL op.
  const managerKey = await tezosToolkit.rpc.getManagerKey(sender);
  const needsReveal = !managerKey;
  if (needsReveal) {
    if (!normalizedPk || validatePublicKey(normalizedPk) !== ValidationResult.VALID) {
      throw new Error("craftRawOperations: a valid public key is required to reveal the sender");
    }
    // The key must belong to the sender, otherwise the node rejects it as inconsistent_hash.
    if (getPkhfromPk(normalizedPk) !== sender) {
      throw new Error("craftRawOperations: public key does not match the sender address");
    }
    const reveal = await estimateRevealLimits(tezosToolkit, sender, feesConfig);
    contents.push({
      kind: OpKind.REVEAL,
      source: sender,
      counter: counter.toString(),
      fee: reveal.fee.toString(),
      gas_limit: reveal.gasLimit.toString(),
      storage_limit: reveal.storageLimit.toString(),
      public_key: normalizedPk,
    });
    counter += 1;
  }

  const estimates = await estimateOperations(operations, sender, needsReveal, tezosToolkit);
  operations.forEach((op, index) => {
    contents.push(buildOperationContent(op, sender, counter, minFees, estimates?.[index]));
    counter += 1;
  });

  return rawEncode(contents);
}

function parseOperations(rawTransaction: string): PartialTezosOperation[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawTransaction);
  } catch {
    throw new Error("craftRawOperations: rawTransaction must be a JSON array of operations");
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("craftRawOperations: expected a non-empty array of operations");
  }
  return parsed.map(validateOperation);
}

function validateOperation(op: unknown): PartialTezosOperation {
  if (!op || typeof op !== "object") {
    throw new Error("craftRawOperations: invalid operation");
  }
  const candidate = op as Record<string, unknown>;
  assertOptionalLimits(candidate);
  switch (candidate.kind) {
    case "transaction":
      if (!isValidAddress(candidate.destination)) {
        throw new Error("craftRawOperations: a transaction requires a valid `destination` address");
      }
      assertMutezAmount(candidate.amount);
      return candidate as PartialTezosTransactionOperation;
    case "delegation":
      // A delegation with no `delegate` is an undelegation; when present it must be a valid
      // implicit account (an empty/invalid string must not be silently treated as absent).
      if (candidate.delegate !== undefined && !isImplicitAddress(candidate.delegate)) {
        throw new Error(
          "craftRawOperations: `delegate` must be a valid implicit account address when present",
        );
      }
      return candidate as unknown as PartialTezosDelegationOperation;
    default:
      throw new UnsupportedOperationKind("unsupported operation kind", {
        kind: String(candidate.kind),
      });
  }
}

function isValidAddress(value: unknown): value is string {
  return typeof value === "string" && validateAddress(value) === ValidationResult.VALID;
}

function isImplicitAddress(value: unknown): value is string {
  return typeof value === "string" && validateKeyHash(value) === ValidationResult.VALID;
}

function assertMutezAmount(amount: unknown): void {
  if (typeof amount !== "string" || !/^\d+$/.test(amount)) {
    throw new Error("craftRawOperations: `amount` must be a non-negative integer string (mutez)");
  }
  if (BigInt(amount) > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("craftRawOperations: `amount` exceeds the safe integer range");
  }
}

function assertOptionalLimits(candidate: Record<string, unknown>): void {
  for (const field of ["fee", "gas_limit", "storage_limit"] as const) {
    const value = candidate[field];
    if (value !== undefined && (typeof value !== "string" || !/^\d+$/.test(value))) {
      throw new Error(`craftRawOperations: \`${field}\` must be a non-negative integer string`);
    }
  }
}

/**
 * Estimate the whole batch in a single simulation so that gas/storage for operations
 * that depend on earlier ones in the same batch are accounted for (a per-op estimate
 * would simulate each against head state and can under-estimate). Returns one estimate
 * per operation, or `undefined` when every operation already carries all three limits.
 */
async function estimateOperations(
  operations: PartialTezosOperation[],
  sender: string,
  needsReveal: boolean,
  tezosToolkit: ReturnType<typeof getTezosToolkit>,
): Promise<Estimate[] | undefined> {
  const needsEstimation = operations.some(
    op => op.fee === undefined || op.gas_limit === undefined || op.storage_limit === undefined,
  );
  if (!needsEstimation) return undefined;

  const params: ParamsWithKind[] = operations.map(op => toBatchParam(op, sender));
  const estimates = await tezosToolkit.estimate.batch(params);
  // Taquito may prepend a single reveal estimate when the source is unrevealed. Accept N
  // (no prepend) or N+1 (prepended) only in that case; for a revealed source require
  // exactly N so a stray estimate fails loudly instead of silently misaligning per-op.
  const maxExpected = operations.length + (needsReveal ? 1 : 0);
  if (estimates.length < operations.length || estimates.length > maxExpected) {
    const expected = needsReveal ? `${operations.length} or ${maxExpected}` : `${operations.length}`;
    throw new Error(
      `craftRawOperations: expected ${expected} estimate(s) for ${operations.length} operation(s), got ${estimates.length}`,
    );
  }
  // Keep the trailing N estimates, dropping a prepended reveal estimate if present. The
  // REVEAL op itself uses estimateRevealLimits (config-clamped, consistent with
  // craftTransaction) rather than this batch-prepended value, which is discarded.
  return estimates.slice(estimates.length - operations.length);
}

function toBatchParam(op: PartialTezosOperation, sender: string): ParamsWithKind {
  switch (op.kind) {
    case "transaction":
      return {
        kind: OpKind.TRANSACTION,
        source: sender,
        to: op.destination,
        amount: Number(op.amount),
        mutez: true,
        ...(op.parameters ? { parameter: op.parameters } : {}),
      };
    case "delegation":
      return {
        kind: OpKind.DELEGATION,
        source: sender,
        ...(op.delegate === undefined ? {} : { delegate: op.delegate }),
      };
    default:
      return assertNever(op);
  }
}

function buildOperationContent(
  op: PartialTezosOperation,
  sender: string,
  counter: number,
  minFees: number,
  estimate?: Estimate,
): OperationContents {
  const limits = resolveLimits(op, minFees, estimate);
  switch (op.kind) {
    case "transaction":
      return {
        kind: OpKind.TRANSACTION,
        source: sender,
        destination: op.destination,
        amount: op.amount,
        counter: counter.toString(),
        fee: limits.fee,
        gas_limit: limits.gasLimit,
        storage_limit: limits.storageLimit,
        ...(op.parameters ? { parameters: op.parameters } : {}),
      };
    case "delegation":
      return {
        kind: OpKind.DELEGATION,
        source: sender,
        counter: counter.toString(),
        fee: limits.fee,
        gas_limit: limits.gasLimit,
        storage_limit: limits.storageLimit,
        ...(op.delegate === undefined ? {} : { delegate: op.delegate }),
      };
    default:
      return assertNever(op);
  }
}

// Compile-time exhaustiveness guard: a new PartialTezosOperation kind becomes a type error
// here. validateOperation already rejects unknown kinds at runtime before crafting.
function assertNever(op: never): never {
  throw new UnsupportedOperationKind("unsupported operation kind", {
    kind: String((op as { kind?: unknown }).kind),
  });
}

/**
 * Honour any fee/gas/storage the caller already provided; fall back to the batch
 * estimate for the missing ones.
 */
function resolveLimits(op: PartialTezosOperation, minFees: number, estimate?: Estimate): ResolvedLimits {
  if (op.fee !== undefined && op.gas_limit !== undefined && op.storage_limit !== undefined) {
    return { fee: op.fee, gasLimit: op.gas_limit, storageLimit: op.storage_limit };
  }
  if (!estimate) {
    throw new Error("craftRawOperations: missing fee estimation for operation");
  }
  return {
    fee: op.fee ?? Math.max(minFees, estimate.suggestedFeeMutez).toString(),
    gasLimit: op.gas_limit ?? estimate.gasLimit.toString(),
    storageLimit: op.storage_limit ?? estimate.storageLimit.toString(),
  };
}
