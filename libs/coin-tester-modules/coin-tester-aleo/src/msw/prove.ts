import { PROGRAM_ID } from "@ledgerhq/coin-aleo/constants";
import { broadcastTransaction, getProgramSource, resolveProgramImports } from "../devnode";
import {
  ALEO_LOCAL_NODE,
  GENESIS_ACCOUNT,
  TRANSFER_PUBLIC_BASE_FEE,
  TRANSFER_PRIVATE_BASE_FEE,
} from "../fixtures";
import { isRecordInputId, type RecordInputId } from "../recordInputId";
import { hasVendoredSource, readRawProgramSource } from "../tokenContracts";
import type { AleoWasm } from "../wasm";
import { loadAleoWasm } from "../wasm";
import { INDEXED_PROGRAMS } from "./programs";
import type { RecordStore } from "./records";

const TRANSFER_PUBLIC_FUNCTION = "transfer_public";
const FEE_PUBLIC_INPUT_TYPES = ["u64.public", "u64.public", "field.public"];

const TRANSFER_PRIVATE_FUNCTION = "transfer_private";
const TRANSFER_PRIVATE_INPUT_TYPES = ["credits.record", "address.private", "u64.private"];
const FEE_PRIVATE_INPUT_TYPES = ["credits.record", "u64.public", "u64.public", "field.public"];

// credits.aleo/transfer_public_to_private: [address.private, u64.public], no record
// input — a public-balance conversion into a fresh private record. Its fee still
// runs through fee_public, at the CONVERT_PUBLIC_TO_PRIVATE rate.
const TRANSFER_PUBLIC_TO_PRIVATE_FUNCTION = "transfer_public_to_private";
const TRANSFER_PUBLIC_TO_PRIVATE_INPUT_TYPES = ["address.private", "u64.public"];

// credits.aleo/transfer_private_to_public: the spent record first, then the
// receiver and the amount, both public. Its fee runs through fee_private.
const TRANSFER_PRIVATE_TO_PUBLIC_FUNCTION = "transfer_private_to_public";
const TRANSFER_PRIVATE_TO_PUBLIC_INPUT_TYPES = ["credits.record", "address.public", "u64.public"];

/**
 * Request input types for the credits.aleo functions that do not take the
 * `[address.public, u64.public]` pair every other indexed transition takes.
 */
const CREDITS_INPUT_TYPES: Record<string, string[]> = {
  [TRANSFER_PUBLIC_TO_PRIVATE_FUNCTION]: TRANSFER_PUBLIC_TO_PRIVATE_INPUT_TYPES,
  [TRANSFER_PRIVATE_TO_PUBLIC_FUNCTION]: TRANSFER_PRIVATE_TO_PUBLIC_INPUT_TYPES,
};

/**
 * Functions that spend a record. They pay through credits.aleo/fee_private,
 * out of a second record, while every other function pays fee_public out of
 * the transparent balance.
 */
const PRIVATE_FEE_FUNCTIONS = new Set([
  TRANSFER_PRIVATE_FUNCTION,
  TRANSFER_PRIVATE_TO_PUBLIC_FUNCTION,
]);

export type ExpectedTransfer = {
  recipient: string;
  amount: number;
  /**
   * Who `buildTransaction` signs the devnode transaction as. Defaults to
   * GENESIS_ACCOUNT: `buildDevnodeExecutionTransaction` needs a plaintext
   * private key to build a proofless transaction and does not consume the
   * incoming authorization, so whoever actually holds the authorization is
   * irrelevant to it — only this field decides who spends on-chain.
   */
  senderPrivateKey?: string;
  /**
   * The store `buildTransaction` reads the amount and fee record plaintexts
   * from, keyed by the commitments carried in the prove request's own
   * `input_ids()`. Its presence is what selects the `transfer_private` path —
   * the public path never touches a record.
   */
  privateRecordStore?: RecordStore;
  /** Defaults to PROGRAM_ID.CREDITS. Set for a token-program request (e.g. TOKEN_PROGRAM_ID). */
  programId?: string;
};

export type ProveRequestBody = {
  authorization: Record<string, unknown>;
  fee_authorization?: Record<string, unknown>;
  broadcast: boolean;
};

export type ProveResponse = {
  transaction: { id: string };
  broadcast_result: { status: string };
};

/**
 * Recovers a signed `ExecutionRequest` from an Authorization.
 *
 * Authorization exposes no accessor for its requests, so the way in is
 * `toString()`: snarkVM 4.5.4 serializes it as `{"requests": [...],
 * "transitions": [...]}`.
 */
// `InstanceType<AleoWasm["Authorization"]>` does not typecheck: the wasm classes
// declare a private constructor, so they are not assignable to a construct
// signature. The static factories give the same instance types.
type WasmAuthorization = ReturnType<AleoWasm["Authorization"]["fromString"]>;
type WasmField = ReturnType<AleoWasm["Field"]["fromBytesLe"]>;
type WasmExecutionRequest = ReturnType<AleoWasm["ExecutionRequest"]["fromString"]>;

function recoverRequest(
  wasm: AleoWasm,
  authorization: WasmAuthorization,
  index: number,
): WasmExecutionRequest {
  const parsed = JSON.parse(authorization.toString()) as {
    requests?: unknown[];
  };
  const raw = parsed.requests?.[index];
  if (!raw) {
    throw new Error(`aleo coin-tester: authorization has no request at index ${index}`);
  }
  return wasm.ExecutionRequest.fromString(JSON.stringify(raw));
}

/**
 * snarkVM splices a `program_checksum` into a request's signed message exactly
 * when the called program declares a `constructor` (`Stack::authorize`), so a
 * verifier must supply one on the same condition. `Request`'s `is_dynamic` flag
 * is unrelated — it distinguishes `call.dynamic` from `call` — and never
 * appears in the V1 request JSON the wasm SDK emits.
 */
function programDeclaresConstructor(programId: string): boolean {
  return hasVendoredSource(programId) && /^constructor:/m.test(readRawProgramSource(programId));
}

/** Bits a BLS12-377 scalar field element carries as data — one below its 253-bit modulus. */
const FIELD_SIZE_IN_DATA_BITS = 252;

/**
 * The `program_checksum` field element for `programSource`, matching
 * `Stack::program_checksum_as_field`: the low `FIELD_SIZE_IN_DATA_BITS` bits of
 * the program's 32-byte Keccak-256 checksum, read little-endian. Handing
 * `verify()` the untruncated 32 bytes yields a different element, and the
 * signature check fails.
 */
function computeProgramChecksum(wasm: AleoWasm, programSource: string): WasmField {
  const checksum = Uint8Array.from(wasm.Program.fromString(programSource).toChecksum());
  const wholeBytes = FIELD_SIZE_IN_DATA_BITS >> 3;
  const remainingBits = FIELD_SIZE_IN_DATA_BITS & 7;
  const truncated = checksum.slice(0, wholeBytes + (remainingBits ? 1 : 0));
  if (remainingBits) truncated[wholeBytes] &= (1 << remainingBits) - 1;
  return wasm.Field.fromBytesLe(truncated);
}

/**
 * `@provablehq/wasm` prints `_version: 0u8` on every decrypted record
 * plaintext regardless of the record's real version, which yields a
 * commitment the chain never produced. Bumping it by one reproduces the
 * chain's real commitment. See `docs/wasm-record-commitment.md`.
 */
export function correctRecordVersion(plaintext: string): string {
  const versionMatch = plaintext.match(/_version:\s*(\d+)u8/);
  if (!versionMatch) {
    throw new Error("aleo coin-tester: record plaintext carries no _version field");
  }
  const corrected = Number(versionMatch[1]) + 1;
  return plaintext.replace(/_version:\s*\d+u8/, `_version: ${corrected}u8`);
}

/**
 * Checks a transfer request's recipient and amount against what was expected,
 * at whichever input positions the caller's transfer function puts them —
 * `transfer_public`'s inputs are `[recipient, amount]`, `transfer_private`'s
 * are `[record, recipient, amount]`.
 */
function checkRecipientAndAmount(
  inputs: string[],
  recipientIndex: number,
  amountIndex: number,
  amountSuffix: "u64" | "u128",
  expected: ExpectedTransfer,
): void {
  const recipient = inputs[recipientIndex];
  const amount = inputs[amountIndex];
  if (recipient !== expected.recipient) {
    throw new Error(
      `aleo coin-tester: signed recipient ${recipient} does not match the expected ${expected.recipient}`,
    );
  }
  if (amount !== `${expected.amount}${amountSuffix}`) {
    throw new Error(
      `aleo coin-tester: signed amount ${amount} does not match the expected ${expected.amount}${amountSuffix}`,
    );
  }
}

/**
 * Checks a fee request's base and priority fee, at whichever input positions
 * the caller's fee function puts them — `fee_public`'s inputs are
 * `[baseFee, priorityFee, executionId]`, `fee_private`'s are
 * `[record, baseFee, priorityFee, executionId]`.
 */
function checkFeeAmounts(
  inputs: string[],
  baseFeeIndex: number,
  priorityFeeIndex: number,
  expectedBaseFee: number,
): void {
  const baseFee = inputs[baseFeeIndex];
  const priorityFee = inputs[priorityFeeIndex];
  if (baseFee !== `${expectedBaseFee}u64`) {
    throw new Error(
      `aleo coin-tester: expected a base fee of ${expectedBaseFee}u64, got ${baseFee}`,
    );
  }
  if (priorityFee !== "0u64") {
    throw new Error(`aleo coin-tester: expected a priority fee of 0u64, got ${priorityFee}`);
  }
}

/**
 * This is the only place the fee the bridge computed is still visible —
 * `buildTransaction` does not carry it over. The assertions pin that the
 * bridge's configured `feeByTransactionType` entry survives the fee path
 * unchanged; they do not prove those constants are correct for the network.
 */
export async function verifyAuthorizations(
  body: ProveRequestBody,
  expected: ExpectedTransfer,
): Promise<void> {
  const wasm = await loadAleoWasm();

  const authorization = wasm.Authorization.fromString(JSON.stringify(body.authorization));
  const request = recoverRequest(wasm, authorization, 0);
  const programId = expected.programId ?? PROGRAM_ID.CREDITS;

  if (request.programId() !== programId) {
    throw new Error(`aleo coin-tester: expected program ${programId}, got ${request.programId()}`);
  }

  const functionName = request.functionName();

  if (functionName === TRANSFER_PRIVATE_FUNCTION) {
    if (!request.verify(TRANSFER_PRIVATE_INPUT_TYPES, true)) {
      throw new Error("aleo coin-tester: the private transfer request failed verify()");
    }
    checkRecipientAndAmount(request.inputs() as string[], 1, 2, "u64", expected);
  } else {
    const descriptor = INDEXED_PROGRAMS[programId]?.[functionName];
    if (!descriptor) {
      throw new Error(`aleo coin-tester: no known request shape for ${programId}/${functionName}`);
    }

    const inputTypes = (programId === PROGRAM_ID.CREDITS
      ? CREDITS_INPUT_TYPES[functionName]
      : undefined) ?? [`address.public`, `${descriptor.amountSuffix}.public`];

    // `verify()`'s third argument must be present exactly when the signed
    // message carried a checksum, and absent otherwise — either mismatch makes
    // verify() return false. The checksum must be recomputed from the same
    // bytes `aleo-backend` signed against: its own vendored, unpatched copy of
    // the program (`include_str!`'d at compile time, `intent.rs:81`), not the
    // on-chain deployed copy, whose admin gate literal is replaced with the
    // real runtime admin address and so checksums differently. Recomputing it
    // proves nothing beyond echoing back what the signer used, but that's
    // enough to satisfy verify()'s signature check.
    const programChecksum = programDeclaresConstructor(programId)
      ? computeProgramChecksum(wasm, readRawProgramSource(programId))
      : undefined;

    if (!request.verify(inputTypes, true, programChecksum)) {
      throw new Error(`aleo coin-tester: the ${functionName} request failed verify()`);
    }
    checkRecipientAndAmount(
      request.inputs() as string[],
      descriptor.recipientInputIndex,
      descriptor.amountInputIndex,
      descriptor.amountSuffix,
      expected,
    );
  }

  if (!body.fee_authorization) {
    throw new Error(
      "aleo coin-tester: missing fee authorization — the tester runs with isFeeSponsored: false",
    );
  }
  const feeAuthorization = wasm.Authorization.fromString(JSON.stringify(body.fee_authorization));

  if (PRIVATE_FEE_FUNCTIONS.has(functionName)) {
    if (!feeAuthorization.isFeePrivate()) {
      throw new Error(
        `aleo coin-tester: expected a fee_private authorization, got ${feeAuthorization.functionName()}`,
      );
    }
    const feeRequest = recoverRequest(wasm, feeAuthorization, 0);
    if (!feeRequest.verify(FEE_PRIVATE_INPUT_TYPES, true)) {
      throw new Error("aleo coin-tester: the fee request failed verify()");
    }
    const expectedBaseFee =
      INDEXED_PROGRAMS[programId]?.[functionName]?.baseFee ?? TRANSFER_PRIVATE_BASE_FEE;
    checkFeeAmounts(feeRequest.inputs() as string[], 1, 2, expectedBaseFee);
  } else {
    if (!feeAuthorization.isFeePublic()) {
      throw new Error(
        `aleo coin-tester: expected a fee_public authorization, got ${feeAuthorization.functionName()}`,
      );
    }
    const feeRequest = recoverRequest(wasm, feeAuthorization, 0);
    if (!feeRequest.verify(FEE_PUBLIC_INPUT_TYPES, true)) {
      throw new Error("aleo coin-tester: the fee request failed verify()");
    }
    const expectedBaseFee =
      INDEXED_PROGRAMS[programId]?.[functionName]?.baseFee ?? TRANSFER_PUBLIC_BASE_FEE;
    checkFeeAmounts(feeRequest.inputs() as string[], 0, 1, expectedBaseFee);
  }
}

/** The commitment of a request's sole record input, read off `input_ids()`. */
function recordCommitment(request: WasmExecutionRequest): string {
  const [recordInputId] = request.input_ids().filter(isRecordInputId) as RecordInputId[];
  if (!recordInputId) {
    throw new Error("aleo coin-tester: expected a record input, found none in input_ids()");
  }
  return recordInputId[0].toString();
}

/** Looks up a request's record input in `store` and version-corrects its plaintext. */
function resolveRecordPlaintext(store: RecordStore, request: WasmExecutionRequest): string {
  const commitment = recordCommitment(request);
  const plaintext = store.plaintextByCommitment(commitment);
  if (!plaintext) {
    throw new Error(`aleo coin-tester: no record plaintext for commitment ${commitment}`);
  }
  return correctRecordVersion(plaintext);
}

/**
 * Produces the transaction the devnode will accept.
 *
 * `buildDevnodeExecutionTransaction` signs afresh from a private key, so it
 * doesn't consume the incoming authorization, and charges only a priority
 * fee — a proofless transaction's real devnode cost, below what the bridge
 * billed. Use the static `ProgramManagerBase` method, not the instance method
 * on `ProgramManager` (same name, options-object signature, throws
 * `getProgramObject` when called positionally). Pass the bare
 * `ALEO_LOCAL_NODE` as `url`: the wasm client appends its own network
 * segment, so a network-qualified base would double into `/testnet/testnet/...`.
 *
 * `body` is needed only for `transfer_private` (via
 * `expected.privateRecordStore`), to read the amount/fee record commitments
 * off each authorization's `input_ids()`; its root authorization also picks
 * `transfer_public` vs `transfer_public_to_private` when present. With no
 * authorization to read (the direct-to-devnode funding helpers), it defaults
 * to `transfer_public`.
 */
export async function buildTransaction(
  expected: ExpectedTransfer,
  body?: ProveRequestBody,
): Promise<{ id: string }> {
  const wasm = await loadAleoWasm();
  const senderPrivateKey = wasm.PrivateKey.from_string(
    expected.senderPrivateKey ?? GENESIS_ACCOUNT.privateKey,
  );
  const programId = expected.programId ?? PROGRAM_ID.CREDITS;
  const programSource = await getProgramSource(programId);
  const imports = await resolveProgramImports(programSource);

  if (expected.privateRecordStore) {
    if (!body) {
      throw new Error(
        "aleo coin-tester: buildTransaction needs the prove request body to find the private records it spends",
      );
    }
    if (!body.fee_authorization) {
      throw new Error(
        "aleo coin-tester: buildTransaction needs a fee authorization to find the private fee record",
      );
    }

    const rootRequest = recoverRequest(
      wasm,
      wasm.Authorization.fromString(JSON.stringify(body.authorization)),
      0,
    );
    const feeRequest = recoverRequest(
      wasm,
      wasm.Authorization.fromString(JSON.stringify(body.fee_authorization)),
      0,
    );

    // The `inputs` array wants every element as a string (a bare RecordPlaintext
    // here throws "all inputs must be a string specifying the type"); `fee_record`
    // is the opposite — its own positional parameter, typed as a RecordPlaintext.
    const amountRecordPlaintext = resolveRecordPlaintext(expected.privateRecordStore, rootRequest);
    const feeRecordPlaintext = resolveRecordPlaintext(expected.privateRecordStore, feeRequest);

    const transaction = await wasm.ProgramManagerBase.buildDevnodeExecutionTransaction(
      senderPrivateKey,
      programSource,
      TRANSFER_PRIVATE_FUNCTION,
      [amountRecordPlaintext, expected.recipient, `${expected.amount}u64`],
      0,
      wasm.RecordPlaintext.fromString(feeRecordPlaintext),
      ALEO_LOCAL_NODE,
      imports,
    );

    await broadcastTransaction(transaction.toString());
    return { id: transaction.id() };
  }

  const functionName = body
    ? recoverRequest(
        wasm,
        wasm.Authorization.fromString(JSON.stringify(body.authorization)),
        0,
      ).functionName()
    : TRANSFER_PUBLIC_FUNCTION;

  const devnodeFunction =
    functionName === TRANSFER_PUBLIC_TO_PRIVATE_FUNCTION
      ? TRANSFER_PUBLIC_TO_PRIVATE_FUNCTION
      : functionName;

  const descriptor = INDEXED_PROGRAMS[programId]?.[devnodeFunction];
  const amountSuffix = descriptor?.amountSuffix ?? "u64";

  const transaction = await wasm.ProgramManagerBase.buildDevnodeExecutionTransaction(
    senderPrivateKey,
    programSource,
    devnodeFunction,
    [expected.recipient, `${expected.amount}${amountSuffix}`],
    0,
    undefined,
    ALEO_LOCAL_NODE,
    imports,
  );

  await broadcastTransaction(transaction.toString());
  return { id: transaction.id() };
}

export async function handleProve(
  body: ProveRequestBody,
  expected: ExpectedTransfer,
): Promise<ProveResponse> {
  await verifyAuthorizations(body, expected);
  const transaction = await buildTransaction(expected, body);

  return { transaction, broadcast_result: { status: "Accepted" } };
}
