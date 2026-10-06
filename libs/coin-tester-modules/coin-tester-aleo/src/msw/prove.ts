import { PROGRAM_ID } from "@ledgerhq/coin-aleo/constants";
import type { DevnodeTransaction } from "../devnode";
import { ALEO_LOCAL_NODE } from "../constants";
import { broadcastTransaction, getProgramSource, resolveProgramImports } from "../devnode";
import { GENESIS_ACCOUNT } from "../fixtures";
import { isRecordInputId, type RecordInputId } from "../recordInputId";
import type { AleoWasm } from "../wasm";
import { loadAleoWasm } from "../wasm";
import { parseFee } from "./indexer";
import { INDEXED_PROGRAMS } from "./programs";
import { makeRecordResolver, type RecordStore } from "./records";
import { recordSponsoredFee, reimburseFee } from "./sponsor";

const TRANSFER_PUBLIC_FUNCTION = "transfer_public";
const TRANSFER_PUBLIC_INPUT_TYPES = ["address.public", "u64.public"];

const TRANSFER_PRIVATE_FUNCTION = "transfer_private";
const TRANSFER_PRIVATE_INPUT_TYPES = ["credits.record", "address.private", "u64.private"];

const TRANSFER_PUBLIC_TO_PRIVATE_FUNCTION = "transfer_public_to_private";
const TRANSFER_PUBLIC_TO_PRIVATE_INPUT_TYPES = ["address.private", "u64.public"];

const TRANSFER_PRIVATE_TO_PUBLIC_FUNCTION = "transfer_private_to_public";
const TRANSFER_PRIVATE_TO_PUBLIC_INPUT_TYPES = ["credits.record", "address.public", "u64.public"];

const CREDITS_INPUT_TYPES: Record<string, string[]> = {
  [TRANSFER_PUBLIC_FUNCTION]: TRANSFER_PUBLIC_INPUT_TYPES,
  [TRANSFER_PUBLIC_TO_PRIVATE_FUNCTION]: TRANSFER_PUBLIC_TO_PRIVATE_INPUT_TYPES,
  [TRANSFER_PRIVATE_TO_PUBLIC_FUNCTION]: TRANSFER_PRIVATE_TO_PUBLIC_INPUT_TYPES,
};

export type ExpectedTransfer = {
  recipient: string;
  amount: number;
  /** Who spends on-chain (default GENESIS_ACCOUNT); the incoming authorization is never consumed. */
  senderPrivateKey?: string;
  privateRecordStore?: RecordStore;
};

export type ProveRequestBody = {
  authorization: Record<string, unknown>;
  /** The bridge omits it on the plain path and sends `null` on the encrypted one. */
  fee_authorization?: Record<string, unknown> | null;
  broadcast: boolean;
};

export type ProveResponse = {
  transaction: { id: string };
  broadcast_result: { status: string };
};

// Not `InstanceType<...>`: the wasm classes have private constructors.
type WasmAuthorization = ReturnType<AleoWasm["Authorization"]["fromString"]>;
type WasmExecutionRequest = ReturnType<AleoWasm["ExecutionRequest"]["fromString"]>;

// Authorization has no requests accessor; its toString() is `{"requests": [...], ...}`.
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

export async function verifyAuthorizations(
  body: ProveRequestBody,
  expected: ExpectedTransfer,
): Promise<void> {
  const wasm = await loadAleoWasm();

  if (body.broadcast !== true) {
    throw new Error("aleo coin-tester: expected a prove request with broadcast: true");
  }
  if (body.fee_authorization != null) {
    throw new Error(
      "aleo coin-tester: unexpected fee authorization — production runs with isFeeSponsored: true",
    );
  }

  const authorization = wasm.Authorization.fromString(JSON.stringify(body.authorization));
  const request = recoverRequest(wasm, authorization, 0);
  const programId = PROGRAM_ID.CREDITS;

  if (request.programId() !== programId) {
    throw new Error(`aleo coin-tester: expected program ${programId}, got ${request.programId()}`);
  }

  const functionName = request.functionName();

  if (functionName === TRANSFER_PRIVATE_FUNCTION) {
    if (!request.verify(TRANSFER_PRIVATE_INPUT_TYPES, true)) {
      throw new Error("aleo coin-tester: the private transfer request failed verify()");
    }
    checkRecipientAndAmount(request.inputs() as string[], 1, 2, "u64", expected);
    return;
  }

  const descriptor = INDEXED_PROGRAMS[programId][functionName];
  const inputTypes = CREDITS_INPUT_TYPES[functionName];
  if (!descriptor || !inputTypes) {
    throw new Error(`aleo coin-tester: no known request shape for ${programId}/${functionName}`);
  }

  if (!request.verify(inputTypes, true)) {
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

function recordCommitment(request: WasmExecutionRequest): string {
  const [recordInputId] = request.input_ids().filter(isRecordInputId) as RecordInputId[];
  if (!recordInputId) {
    throw new Error("aleo coin-tester: expected a record input, found none in input_ids()");
  }
  return recordInputId[0].toString();
}

function resolveRecordPlaintext(store: RecordStore, request: WasmExecutionRequest): string {
  return makeRecordResolver(store)(recordCommitment(request));
}

type WasmTransaction = Awaited<
  ReturnType<AleoWasm["ProgramManagerBase"]["buildDevnodeExecutionTransaction"]>
>;

// The static ProgramManagerBase method: ProgramManager's same-named instance method has another signature.
// ALEO_LOCAL_NODE must stay bare: the wasm client appends the network segment itself.
async function buildDevnodeTransaction(
  expected: ExpectedTransfer,
  body?: ProveRequestBody,
): Promise<WasmTransaction> {
  const wasm = await loadAleoWasm();
  const senderPrivateKey = wasm.PrivateKey.from_string(
    expected.senderPrivateKey ?? GENESIS_ACCOUNT.privateKey,
  );
  const programSource = await getProgramSource(PROGRAM_ID.CREDITS);
  const imports = await resolveProgramImports(programSource);

  if (expected.privateRecordStore) {
    if (!body) {
      throw new Error(
        "aleo coin-tester: buildTransaction needs the prove request body to find the private record it spends",
      );
    }

    const rootRequest = recoverRequest(
      wasm,
      wasm.Authorization.fromString(JSON.stringify(body.authorization)),
      0,
    );

    const amountRecordPlaintext = resolveRecordPlaintext(expected.privateRecordStore, rootRequest);

    return wasm.ProgramManagerBase.buildDevnodeExecutionTransaction(
      senderPrivateKey,
      programSource,
      rootRequest.functionName(),
      [amountRecordPlaintext, expected.recipient, `${expected.amount}u64`],
      0,
      undefined,
      ALEO_LOCAL_NODE,
      imports,
    );
  }

  const functionName = body
    ? recoverRequest(
        wasm,
        wasm.Authorization.fromString(JSON.stringify(body.authorization)),
        0,
      ).functionName()
    : TRANSFER_PUBLIC_FUNCTION;

  const descriptor = INDEXED_PROGRAMS[PROGRAM_ID.CREDITS][functionName];
  const amountSuffix = descriptor?.amountSuffix ?? "u64";

  return wasm.ProgramManagerBase.buildDevnodeExecutionTransaction(
    senderPrivateKey,
    programSource,
    functionName,
    [expected.recipient, `${expected.amount}${amountSuffix}`],
    0,
    undefined,
    ALEO_LOCAL_NODE,
    imports,
  );
}

export async function buildTransaction(
  expected: ExpectedTransfer,
  body?: ProveRequestBody,
): Promise<{ id: string }> {
  const transaction = await buildDevnodeTransaction(expected, body);
  await broadcastTransaction(transaction.toString());
  return { id: transaction.id() };
}

function feeOf(transaction: WasmTransaction): number {
  return parseFee(JSON.parse(transaction.toString()) as DevnodeTransaction);
}

// Reimburse first: a send-max or an account without public credits could not cover the fee.
// The first build only prices the fee; the broadcast one is rebuilt on the reimbursed state.
async function broadcastSponsored(
  expected: ExpectedTransfer,
  body: ProveRequestBody,
): Promise<{ id: string }> {
  const wasm = await loadAleoWasm();
  const payer = wasm.PrivateKey.from_string(expected.senderPrivateKey ?? GENESIS_ACCOUNT.privateKey)
    .to_address()
    .to_string();

  const reimbursedFee = feeOf(await buildDevnodeTransaction(expected, body));
  await reimburseFee(payer, reimbursedFee);

  const transaction = await buildDevnodeTransaction(expected, body);
  const fee = feeOf(transaction);
  if (fee !== reimbursedFee) {
    throw new Error(
      `aleo coin-tester: the rebuilt transaction costs ${fee}, but the sponsor reimbursed ${reimbursedFee}`,
    );
  }
  await broadcastTransaction(transaction.toString());

  recordSponsoredFee(transaction.id(), fee);
  return { id: transaction.id() };
}

export async function handleProve(
  body: ProveRequestBody,
  expected: ExpectedTransfer,
): Promise<ProveResponse> {
  await verifyAuthorizations(body, expected);
  const transaction = await broadcastSponsored(expected, body);

  return { transaction, broadcast_result: { status: "Accepted" } };
}
