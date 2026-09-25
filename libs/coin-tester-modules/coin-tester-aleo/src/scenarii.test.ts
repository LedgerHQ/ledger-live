import { readFileSync } from "fs";
import path from "path";
import BigNumber from "bignumber.js";
import { firstValueFrom, reduce } from "rxjs";
import { setupServer } from "msw/node";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import {
  getBlockHeight,
  killStack,
  spawnStack,
  advanceBlocks,
  registerTeardownHooks,
} from "./stack";
import { scenarioTransferPublic } from "./scenarii/transferPublic";
import { scenarioSendMaxPublic } from "./scenarii/sendMaxPublic";
import { scenarioTransferPrivate } from "./scenarii/transferPrivate";
import { scenarioSendMaxPrivate } from "./scenarii/sendMaxPrivate";
import { scenarioTransferPrivateToPublic } from "./scenarii/transferPrivateToPublic";
import { scenarioTransferTokenPublic } from "./scenarii/transferTokenPublic";
import { deployTokenPrograms, mintTokens } from "./bootstrapToken";
import {
  assertGenesisAccountIsFunded,
  generateAleoAccount,
  getPublicBalance,
  PROBE_ADDRESS,
  TOKEN_PROGRAM_ID,
} from "./fixtures";
import { buildMockAleoSigner } from "./signer";
import type { ResolveRecord } from "./tlv/decodeRequest";
import { readTlv, TLV_TAG } from "./tlv/tags";
import type { AleoWasm } from "./wasm";
import {
  getProgramSource,
  getLatestHeight,
  getBlock,
  broadcastTransaction,
  getTransaction,
} from "./devnode";
import { loadAleoWasm } from "./wasm";
import { timed } from "./timing";
import {
  ALEO_LOCAL_NODE,
  ALEO_LOCAL_SDK,
  GENESIS_ACCOUNT,
  RECIPIENT_ACCOUNT,
  TRANSFER_AMOUNT_MICROCREDITS,
  TRANSFER_PUBLIC_BASE_FEE,
  TRANSFER_PRIVATE_BASE_FEE,
  RECORD_A_MICROCREDITS,
  RECORD_B_MICROCREDITS,
  buildAleoCoinConfig,
  makePrivateAleoAccount,
} from "./fixtures";
import type { GeneratedAleoAccount } from "./fixtures";
import { getBridges } from "./helpers";
import { TRANSACTION_TYPE } from "@ledgerhq/coin-aleo/constants";
import type { AleoOperation } from "@ledgerhq/coin-aleo/types";
import {
  buildTransaction,
  correctRecordVersion,
  handleProve,
  verifyAuthorizations,
} from "./msw/prove";
import { getAccountTransactionRows, scanIndexedTransfers } from "./msw/indexer";
import { fetchAccountBalanceV2, fetchLatestBlockV2, fetchTransactionV2 } from "./msw/node";
import { createRecordStore } from "./msw/records";
import type { RecordStore } from "./msw/records";
import { createFakeScanner } from "./msw/scanner";
import { buildAleoHandlers, buildScannerHandlers } from "./msw/handlers";
import sodium from "libsodium-wrappers";

jest.setTimeout(600_000);

registerTeardownHooks();

// One stack shared by every describe in this file.
beforeAll(
  async () => {
    await spawnStack();
    await deployTokenPrograms(GENESIS_ACCOUNT);
  },
  10 * 60 * 1000,
);

afterAll(async () => {
  await killStack();
});

describe("Aleo devnode", () => {
  it("serves a ledger", async () => {
    const height = await getBlockHeight();
    expect(height).toBeGreaterThanOrEqual(1);
  });

  it("starts with a funded genesis account", async () => {
    await expect(assertGenesisAccountIsFunded()).resolves.toBeUndefined();
  });
});

describe("Aleo SDK backend", () => {
  it("answers a health check", async () => {
    const response = await fetch("http://127.0.0.1:3031/_health");
    expect(response.status).toBe(200);
  });
});

async function postSdk<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${ALEO_LOCAL_SDK}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`POST ${path} failed: HTTP ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as T;
}

type PreparedRequest = {
  is_root: boolean;
  network_id: number;
  program_id: string;
  function_name: string;
  inputs: string[];
  input_types: string[];
  nested_calls?: PreparedRequest[];
  record_commitments?: string[];
  tlv: string;
};

describe("mock signer TLV round trip", () => {
  const signer = buildMockAleoSigner(GENESIS_ACCOUNT.privateKey);

  it("derives the genesis address and view key from the pinned private key", async () => {
    await expect(signer.getAddress("")).resolves.toStrictEqual({
      address: GENESIS_ACCOUNT.address,
    });
    await expect(signer.getViewKey("")).resolves.toStrictEqual({
      viewKey: GENESIS_ACCOUNT.viewKey,
    });
  });

  it("signs a transfer_public root intent the backend accepts", async () => {
    const request = await postSdk<PreparedRequest>("/transactions/request", {
      intent: {
        type: "transfer_public",
        amount: String(TRANSFER_AMOUNT_MICROCREDITS),
        to: RECIPIENT_ACCOUNT.address,
      },
      fee: {
        function_name: "fee_public",
        max_base_fee: String(TRANSFER_PUBLIC_BASE_FEE),
        max_priority_fee: "0",
      },
      view_key: GENESIS_ACCOUNT.viewKey,
    });

    const { signature } = await signer.signRootIntent("", Buffer.from(request.tlv, "hex"));

    const authorization = await postSdk<{ authorization: unknown; execution_id: string }>(
      "/transactions/authorization",
      { request, signatures: [signature], view_key: GENESIS_ACCOUNT.viewKey },
    );

    expect(typeof authorization.execution_id).toBe("string");
    expect(authorization.execution_id.length).toBeGreaterThan(0);
    expect(authorization.authorization).toBeTruthy();
  });

  it("signs a fee_public intent the backend accepts", async () => {
    const root = await postSdk<PreparedRequest>("/transactions/request", {
      intent: {
        type: "transfer_public",
        amount: String(TRANSFER_AMOUNT_MICROCREDITS),
        to: RECIPIENT_ACCOUNT.address,
      },
      fee: {
        function_name: "fee_public",
        max_base_fee: String(TRANSFER_PUBLIC_BASE_FEE),
        max_priority_fee: "0",
      },
      view_key: GENESIS_ACCOUNT.viewKey,
    });
    const { signature: rootSignature } = await signer.signRootIntent(
      "",
      Buffer.from(root.tlv, "hex"),
    );
    const rootAuthorization = await postSdk<{ execution_id: string }>(
      "/transactions/authorization",
      { request: root, signatures: [rootSignature], view_key: GENESIS_ACCOUNT.viewKey },
    );

    const feeRequest = await postSdk<PreparedRequest>("/transactions/request", {
      intent: {
        type: "fee_public",
        base_fee: String(TRANSFER_PUBLIC_BASE_FEE),
        priority_fee: "0",
        execution_id: rootAuthorization.execution_id,
      },
      fee: null,
      view_key: GENESIS_ACCOUNT.viewKey,
    });

    const { signature } = await signer.signFeeIntent(Buffer.from(feeRequest.tlv, "hex"));
    const feeAuthorization = await postSdk<{ authorization: unknown }>(
      "/transactions/authorization",
      { request: feeRequest, signatures: [signature], view_key: GENESIS_ACCOUNT.viewKey },
    );

    expect(feeAuthorization.authorization).toBeTruthy();
  });

  it("signs a transfer_public_to_private root intent the backend accepts, exercising address.private", async () => {
    // Its recipient is address.private (VISIBILITY_BY_BYTE 0x02), the one shape
    // a public-only request never carries.
    const request = await postSdk<PreparedRequest>("/transactions/request", {
      intent: {
        type: "transfer_public_to_private",
        amount: String(TRANSFER_AMOUNT_MICROCREDITS),
        to: RECIPIENT_ACCOUNT.address,
      },
      fee: {
        function_name: "fee_public",
        max_base_fee: String(
          buildAleoCoinConfig().feeByTransactionType[TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE],
        ),
        max_priority_fee: "0",
      },
      view_key: GENESIS_ACCOUNT.viewKey,
    });

    const { signature } = await signer.signRootIntent("", Buffer.from(request.tlv, "hex"));

    const authorization = await postSdk<{ authorization: unknown; execution_id: string }>(
      "/transactions/authorization",
      { request, signatures: [signature], view_key: GENESIS_ACCOUNT.viewKey },
    );

    expect(authorization.authorization).toBeTruthy();
  });

  it("answers every getTvk call with a distinct field element", async () => {
    const tvks = await Promise.all([signer.getTvk(""), signer.getTvk(""), signer.getTvk("")]);
    const encoded = tvks.map(({ tvk }) => Buffer.from(tvk).toString("hex"));

    expect(new Set(encoded).size).toBe(encoded.length);
  });

  it("refuses a nested call before a root intent supplied the root tvk", async () => {
    // The backend recomputes scm = Hash(signer || root_tvk) from the root
    // signature, so a nested signature without that tvk can only fail
    // verification much later, inside aleo-backend.
    const freshSigner = buildMockAleoSigner(GENESIS_ACCOUNT.privateKey);

    await expect(freshSigner.signNestedCall(Buffer.alloc(0))).rejects.toThrow(
      /signNestedCall ran before signRootIntent/,
    );
  });
});

/**
 * Rebuilds the `RecordContent` shape `/transactions/request` expects from a
 * decrypted record plaintext. `toJsObject()` drops `_version`, so that field
 * is read off the (corrected) plaintext string instead.
 */
function recordPlaintextToContent(
  plaintext: string,
  wasm: AleoWasm,
): { owner: string; data: Record<string, string>; nonce: string; version: number } {
  const corrected = correctRecordVersion(plaintext);
  const object = wasm.RecordPlaintext.fromString(corrected).toJsObject() as {
    owner: string;
    microcredits: bigint | number | string;
    _nonce: string;
  };
  const versionMatch = corrected.match(/_version:\s*(\d+)u8/);
  if (!versionMatch) {
    throw new Error("aleo coin-tester: corrected record plaintext lost its _version field");
  }

  return {
    owner: object.owner,
    data: { microcredits: `${object.microcredits}u64.private` },
    nonce: object._nonce,
    version: Number(versionMatch[1]),
  };
}

/** Walks a signature TLV for its `GammasCount` and `Gammas` fields. */
function decodeSignatureGammas(hex: string): { gammasCount: number; gammas: Uint8Array[] } {
  const bytes = new Uint8Array(Buffer.from(hex, "hex"));
  let offset = 0;
  let gammasCount = -1;
  const gammas: Uint8Array[] = [];

  while (offset < bytes.length) {
    const { tag, value, next } = readTlv(bytes, offset);
    offset = next;
    if (tag === TLV_TAG.GammasCount) gammasCount = value[0];
    if (tag === TLV_TAG.Gammas) {
      for (let i = 0; i < value.length; i += 32) gammas.push(value.subarray(i, i + 32));
    }
  }

  return { gammasCount, gammas };
}

describe("mock signer with a record resolver", () => {
  it("signs a transfer_private root intent the backend accepts, and refuses it without a resolver", async () => {
    const owner = await generateAleoAccount();
    const mintedAmount = 5_000_000;
    await mintPrivateRecord(owner.address, mintedAmount);

    const store = createRecordStore({ viewKey: owner.viewKey, address: owner.address });
    await store.refresh();
    const [record] = store.list();
    const plaintext = store.plaintextByCommitment(record.commitment);
    if (!plaintext) {
      throw new Error("test setup: store has no plaintext for the record it just scanned");
    }

    const wasm = await loadAleoWasm();
    const request = await postSdk<PreparedRequest>("/transactions/request", {
      intent: {
        type: "transfer_private",
        amount: String(TRANSFER_AMOUNT_MICROCREDITS),
        to: RECIPIENT_ACCOUNT.address,
        record: recordPlaintextToContent(plaintext, wasm),
      },
      fee: {
        function_name: "fee_public",
        max_base_fee: String(
          buildAleoCoinConfig().feeByTransactionType[TRANSACTION_TYPE.TRANSFER_PRIVATE],
        ),
        max_priority_fee: "0",
      },
      view_key: owner.viewKey,
    });

    // Ground truth: chain's actual commitment (block JSON output.id), decoded via
    // the same wasm.Field.fromBytesLe the TLV decoder uses.
    const requestCommitment = wasm.Field.fromBytesLe(
      Buffer.from(request.record_commitments?.[0] ?? "", "hex"),
    ).toString();
    expect(requestCommitment).toBe(record.commitment);

    const signerWithoutResolver = buildMockAleoSigner(owner.privateKey);
    await expect(
      signerWithoutResolver.signRootIntent("", Buffer.from(request.tlv, "hex")),
    ).rejects.toThrow(
      new RegExp(`no resolver supplied for a record input with commitment ${record.commitment}`),
    );

    const resolveRecord: ResolveRecord = commitment => {
      const recordPlaintext = store.plaintextByCommitment(commitment);
      if (!recordPlaintext) {
        throw new Error(`aleo coin-tester: no record plaintext for commitment ${commitment}`);
      }
      // ExecutionRequest.sign derives its own commitment from this plaintext;
      // see correctRecordVersion's doc comment for why it needs correcting.
      return correctRecordVersion(recordPlaintext);
    };
    const signerWithResolver = buildMockAleoSigner(owner.privateKey, resolveRecord);
    const { signature } = await signerWithResolver.signRootIntent(
      "",
      Buffer.from(request.tlv, "hex"),
    );

    const decodedSignature = decodeSignatureGammas(signature);
    expect(decodedSignature.gammasCount).toBe(1);
    expect(decodedSignature.gammas).toHaveLength(1);
    expect(decodedSignature.gammas[0]).toHaveLength(32);

    // Rust reconstructing the same commitment from the TLV proves the record
    // layout and gamma extraction agree with the backend, not just each other.
    const authorization = await postSdk<{ authorization: unknown; execution_id: string }>(
      "/transactions/authorization",
      { request, signatures: [signature], view_key: owner.viewKey },
    );

    expect(authorization.authorization).toBeTruthy();
  });
});

describe("devnode execution without a proof", () => {
  it("serves the credits.aleo source", async () => {
    const source = await getProgramSource("credits.aleo");
    expect(source).toContain("program credits.aleo");
    expect(source).toContain("transfer_public");
  });

  it("broadcasts a proofless transfer_public and moves the balance", async () => {
    const wasm = await loadAleoWasm();
    const amount = 2_000_000;
    const before = await getPublicBalance(PROBE_ADDRESS);

    // ProgramManagerBase is the underlying wasm class; its static method takes
    // this positional argument list without needing a live networkClient instance.
    const transaction = await wasm.ProgramManagerBase.buildDevnodeExecutionTransaction(
      wasm.PrivateKey.from_string(GENESIS_ACCOUNT.privateKey),
      await getProgramSource("credits.aleo"),
      "transfer_public",
      [PROBE_ADDRESS, `${amount}u64`],
      0,
      undefined,
      // The wasm client appends its own `/${network}/...` segment to this host;
      // a network-qualified base would double it into `/testnet/testnet/...` and 404.
      ALEO_LOCAL_NODE,
    );

    await broadcastTransaction(transaction.toString());
    await advanceBlocks(1);

    expect(await getPublicBalance(PROBE_ADDRESS)).toBe(before + BigInt(amount));

    const height = await getLatestHeight();
    const block = await getBlock(height);
    expect(block.header.metadata.height).toBe(height);
    expect(typeof block.header.metadata.timestamp).toBe("number");
  });

  it("accepts a proofless deployment of a fresh program (step zero)", async () => {
    const wasm = await loadAleoWasm();
    const source = readFileSync(
      path.join(__dirname, "../aleo-backend/contracts/merkle_tree.aleo"),
      "utf8",
    );

    const transaction = await timed("deploy merkle_tree.aleo", () =>
      wasm.ProgramManagerBase.buildDevnodeDeploymentTransaction(
        wasm.PrivateKey.from_string(GENESIS_ACCOUNT.privateKey),
        source,
        0,
        undefined,
        ALEO_LOCAL_NODE,
        {},
      ),
    );

    await broadcastTransaction(transaction.toString());

    let deployedSource: string | undefined;
    for (let attempt = 0; attempt < 10 && !deployedSource; attempt++) {
      await advanceBlocks(1);
      deployedSource = await getProgramSource("merkle_tree.aleo").catch(() => undefined);
    }

    expect(deployedSource).toContain("program merkle_tree.aleo");
  }, 120_000);
});

/** Signs both authorizations exactly the way signOperation does. */
async function buildAuthorizations(recipient: string, amount: number) {
  const signer = buildMockAleoSigner(GENESIS_ACCOUNT.privateKey);

  const rootRequest = await postSdk<PreparedRequest>("/transactions/request", {
    intent: { type: "transfer_public", amount: String(amount), to: recipient },
    fee: {
      function_name: "fee_public",
      max_base_fee: String(TRANSFER_PUBLIC_BASE_FEE),
      max_priority_fee: "0",
    },
    view_key: GENESIS_ACCOUNT.viewKey,
  });
  const { signature: rootSignature } = await signer.signRootIntent(
    "",
    Buffer.from(rootRequest.tlv, "hex"),
  );
  const root = await postSdk<{ authorization: Record<string, unknown>; execution_id: string }>(
    "/transactions/authorization",
    { request: rootRequest, signatures: [rootSignature], view_key: GENESIS_ACCOUNT.viewKey },
  );

  const feeRequest = await postSdk<PreparedRequest>("/transactions/request", {
    intent: {
      type: "fee_public",
      base_fee: String(TRANSFER_PUBLIC_BASE_FEE),
      priority_fee: "0",
      execution_id: root.execution_id,
    },
    fee: null,
    view_key: GENESIS_ACCOUNT.viewKey,
  });
  const { signature: feeSignature } = await signer.signFeeIntent(
    Buffer.from(feeRequest.tlv, "hex"),
  );
  const fee = await postSdk<{ authorization: Record<string, unknown> }>(
    "/transactions/authorization",
    { request: feeRequest, signatures: [feeSignature], view_key: GENESIS_ACCOUNT.viewKey },
  );

  return {
    authorization: root.authorization,
    fee_authorization: fee.authorization,
    broadcast: true,
  };
}

describe("prove handler", () => {
  const amount = 3_000_000;

  it("verifies both authorizations against the expected transfer and fee", async () => {
    const body = await buildAuthorizations(PROBE_ADDRESS, amount);
    await expect(
      verifyAuthorizations(body, { recipient: PROBE_ADDRESS, amount }),
    ).resolves.toBeUndefined();
  });

  it("rejects a swapped recipient", async () => {
    const body = await buildAuthorizations(PROBE_ADDRESS, amount);
    await expect(
      verifyAuthorizations(body, { recipient: RECIPIENT_ACCOUNT.address, amount }),
    ).rejects.toThrow(/recipient/i);
  });

  it("rejects a swapped amount", async () => {
    const body = await buildAuthorizations(PROBE_ADDRESS, amount);
    await expect(
      verifyAuthorizations(body, { recipient: PROBE_ADDRESS, amount: amount + 1 }),
    ).rejects.toThrow(/amount/i);
  });

  it("rejects a request whose signed amount was tampered with", async () => {
    const body = await buildAuthorizations(PROBE_ADDRESS, amount);
    const parsed = JSON.parse(JSON.stringify(body.authorization)) as {
      requests: { inputs: string[] }[];
    };
    parsed.requests[0].inputs[1] = `${amount + 1}u64`;
    await expect(
      verifyAuthorizations(
        { ...body, authorization: parsed as unknown as Record<string, unknown> },
        { recipient: PROBE_ADDRESS, amount: amount + 1 },
      ),
    ).rejects.toThrow(/verify/i);
  });

  it("rejects a missing fee authorization", async () => {
    const body = await buildAuthorizations(PROBE_ADDRESS, amount);
    await expect(
      verifyAuthorizations(
        { authorization: body.authorization, broadcast: true },
        { recipient: PROBE_ADDRESS, amount },
      ),
    ).rejects.toThrow(/fee authorization/i);
  });

  it("builds and broadcasts a transaction the devnode confirms", async () => {
    const before = await getPublicBalance(PROBE_ADDRESS);
    const { id } = await buildTransaction({ recipient: PROBE_ADDRESS, amount });
    await advanceBlocks(1);

    expect(await getPublicBalance(PROBE_ADDRESS)).toBe(before + BigInt(amount));
    await expect(getTransaction(id)).resolves.toMatchObject({ id });
  });

  it("answers the shape logic/broadcast.ts reads", async () => {
    const body = await buildAuthorizations(PROBE_ADDRESS, amount);
    const response = await handleProve(body, { recipient: PROBE_ADDRESS, amount });
    await advanceBlocks(1);

    expect(typeof response.transaction.id).toBe("string");
    expect(response.transaction.id.startsWith("at1")).toBe(true);
    expect(response.broadcast_result.status).toBe("Accepted");
  });
});

/** The commitment of the sole record-typed output of the transaction `id`. */
async function mintedRecordCommitment(id: string): Promise<string> {
  const transaction = await getTransaction(id);
  const outputs = (transaction.execution?.transitions ?? [])
    .flatMap(transition => transition.outputs)
    .filter(candidate => candidate.type === "record");
  if (outputs.length !== 1) {
    throw new Error(
      `test setup: transaction ${id} carries ${outputs.length} record-typed outputs, expected 1`,
    );
  }
  return outputs[0].id;
}

/**
 * Mints RECORD_A (amount record) and RECORD_B (fee record) for `owner`, then
 * signs a `transfer_private` root authorization plus its `fee_private`
 * authorization against them, the way signOperation does. Returns both
 * authorizations plus the store the records were scanned into.
 */
async function buildPrivateAuthorizations(
  owner: GeneratedAleoAccount,
  recipient: string,
  amount: number,
): Promise<{
  authorization: Record<string, unknown>;
  fee_authorization: Record<string, unknown>;
  broadcast: true;
  store: RecordStore;
}> {
  const wasm = await loadAleoWasm();

  const amountMintId = await mintPrivateRecord(owner.address, RECORD_A_MICROCREDITS);
  const feeMintId = await mintPrivateRecord(owner.address, RECORD_B_MICROCREDITS);
  const amountCommitment = await mintedRecordCommitment(amountMintId);
  const feeCommitment = await mintedRecordCommitment(feeMintId);
  if (amountCommitment === feeCommitment) {
    // Otherwise the same record would be spent as both the amount input and
    // the fee record, and the devnode rejects it as a double spend.
    throw new Error(`test setup: both mints resolved to the same record ${amountCommitment}`);
  }

  const store = createRecordStore({ viewKey: owner.viewKey, address: owner.address });
  await store.refresh();

  const amountPlaintext = store.plaintextByCommitment(amountCommitment);
  const feePlaintext = store.plaintextByCommitment(feeCommitment);
  if (!amountPlaintext || !feePlaintext) {
    throw new Error("test setup: store has no plaintext for a just-minted record");
  }

  const resolveRecord: ResolveRecord = commitment => {
    const plaintext = store.plaintextByCommitment(commitment);
    if (!plaintext) {
      throw new Error(`test setup: no record plaintext for commitment ${commitment}`);
    }
    // ExecutionRequest.sign derives its own commitment from this plaintext;
    // see correctRecordVersion's doc comment for why it needs correcting.
    return correctRecordVersion(plaintext);
  };
  const signer = buildMockAleoSigner(owner.privateKey, resolveRecord);

  const rootRequest = await postSdk<PreparedRequest>("/transactions/request", {
    intent: {
      type: "transfer_private",
      amount: String(amount),
      to: recipient,
      record: recordPlaintextToContent(amountPlaintext, wasm),
    },
    fee: {
      function_name: "fee_private",
      max_base_fee: String(TRANSFER_PRIVATE_BASE_FEE),
      max_priority_fee: "0",
    },
    view_key: owner.viewKey,
  });
  const { signature: rootSignature } = await signer.signRootIntent(
    "",
    Buffer.from(rootRequest.tlv, "hex"),
  );
  const root = await postSdk<{ authorization: Record<string, unknown>; execution_id: string }>(
    "/transactions/authorization",
    { request: rootRequest, signatures: [rootSignature], view_key: owner.viewKey },
  );

  const feeRequest = await postSdk<PreparedRequest>("/transactions/request", {
    intent: {
      type: "fee_private",
      base_fee: String(TRANSFER_PRIVATE_BASE_FEE),
      priority_fee: "0",
      execution_id: root.execution_id,
      record: recordPlaintextToContent(feePlaintext, wasm),
    },
    fee: null,
    view_key: owner.viewKey,
  });
  const { signature: feeSignature } = await signer.signFeeIntent(
    Buffer.from(feeRequest.tlv, "hex"),
  );
  const fee = await postSdk<{ authorization: Record<string, unknown> }>(
    "/transactions/authorization",
    { request: feeRequest, signatures: [feeSignature], view_key: owner.viewKey },
  );

  return {
    authorization: root.authorization,
    fee_authorization: fee.authorization,
    broadcast: true,
    store,
  };
}

describe("prove handler private transfer", () => {
  const amount = 1_000_000;

  it("verifies both authorizations against the expected private transfer and fee", async () => {
    const owner = await generateAleoAccount();
    const body = await buildPrivateAuthorizations(owner, PROBE_ADDRESS, amount);
    await expect(
      verifyAuthorizations(body, { recipient: PROBE_ADDRESS, amount }),
    ).resolves.toBeUndefined();
  });

  it("rejects a swapped recipient", async () => {
    const owner = await generateAleoAccount();
    const body = await buildPrivateAuthorizations(owner, PROBE_ADDRESS, amount);
    await expect(
      verifyAuthorizations(body, { recipient: RECIPIENT_ACCOUNT.address, amount }),
    ).rejects.toThrow(/recipient/i);
  });

  it("rejects a swapped amount", async () => {
    const owner = await generateAleoAccount();
    const body = await buildPrivateAuthorizations(owner, PROBE_ADDRESS, amount);
    await expect(
      verifyAuthorizations(body, { recipient: PROBE_ADDRESS, amount: amount + 1 }),
    ).rejects.toThrow(/amount/i);
  });

  it("rejects a missing fee authorization", async () => {
    const owner = await generateAleoAccount();
    const body = await buildPrivateAuthorizations(owner, PROBE_ADDRESS, amount);
    await expect(
      verifyAuthorizations(
        { authorization: body.authorization, broadcast: true },
        { recipient: PROBE_ADDRESS, amount },
      ),
    ).rejects.toThrow(/fee authorization/i);
  });

  it("rejects a fee authorization that is not fee_private", async () => {
    const owner = await generateAleoAccount();
    const body = await buildPrivateAuthorizations(owner, PROBE_ADDRESS, amount);
    const publicBody = await buildAuthorizations(PROBE_ADDRESS, amount);
    await expect(
      verifyAuthorizations(
        {
          authorization: body.authorization,
          fee_authorization: publicBody.fee_authorization,
          broadcast: true,
        },
        { recipient: PROBE_ADDRESS, amount },
      ),
    ).rejects.toThrow(/fee_private/i);
  });

  // Pins the fee_private input layout `[record, baseFee, priorityFee,
  // executionId]` that indexer.ts's parseFee and prove.ts's checkFeeAmounts
  // both read by position. The billed fee value itself is pinned separately,
  // in the scenario, against a bridge-built authorization.
  it("places a fee_private request's base fee at inputs[1], behind the spent record", async () => {
    const owner = await generateAleoAccount();
    const body = await buildPrivateAuthorizations(owner, PROBE_ADDRESS, amount);
    const feeAuthorization = JSON.parse(JSON.stringify(body.fee_authorization)) as {
      requests: { inputs: string[] }[];
    };
    const [feeRequest] = feeAuthorization.requests;

    expect(feeRequest.inputs).toHaveLength(4);
    expect(feeRequest.inputs[1]).toBe(`${TRANSFER_PRIVATE_BASE_FEE}u64`);
    expect(feeRequest.inputs[2]).toBe("0u64");
    await expect(
      verifyAuthorizations(body, { recipient: PROBE_ADDRESS, amount }),
    ).resolves.toBeUndefined();
  });

  it("builds and broadcasts a transaction the devnode confirms, consuming both private records", async () => {
    const owner = await generateAleoAccount();
    const body = await buildPrivateAuthorizations(owner, PROBE_ADDRESS, amount);

    const spentCommitments = new Set(
      body.store.list({ unspent: true }).map(record => record.commitment),
    );
    expect(spentCommitments.size).toBe(2);

    const { id } = await buildTransaction(
      {
        recipient: PROBE_ADDRESS,
        amount,
        senderPrivateKey: owner.privateKey,
        privateRecordStore: body.store,
      },
      body,
    );
    await advanceBlocks(1);
    await body.store.refresh();

    await expect(getTransaction(id)).resolves.toMatchObject({ id });

    // Both spent records must come back marked spent, with change from each
    // showing up as a new unspent record — catches buildTransaction resolving
    // the wrong commitment or plaintext for either record.
    const originals = body.store.list().filter(record => spentCommitments.has(record.commitment));
    expect(originals).toHaveLength(2);
    expect(originals.every(record => record.spent)).toBe(true);

    const newUnspent = body.store.list({ unspent: true });
    expect(newUnspent).toHaveLength(2);
    expect(newUnspent.every(record => !spentCommitments.has(record.commitment))).toBe(true);

    // A change record is a self-spend, so sender must read back as the owner's
    // own address, not the empty string a bare "no future" fallback would produce.
    expect(newUnspent.every(record => record.sender === owner.address)).toBe(true);
  });

  it("lets a genuine recipient scan its inbound record without throwing or mistaking it for a self-spend", async () => {
    const sender = await generateAleoAccount();
    const recipient = await generateAleoAccount();
    const body = await buildPrivateAuthorizations(sender, recipient.address, amount);

    await buildTransaction(
      {
        recipient: recipient.address,
        amount,
        senderPrivateKey: sender.privateKey,
        privateRecordStore: body.store,
      },
      body,
    );
    await advanceBlocks(1);

    // The recipient's store has never seen the sender's records, so its
    // ownedTags cannot recognize the spent input as a self-spend.
    const recipientStore = createRecordStore({
      viewKey: recipient.viewKey,
      address: recipient.address,
    });
    await expect(recipientStore.refresh()).resolves.toBeUndefined();

    const inbound = recipientStore.list({ unspent: true });
    expect(inbound).toHaveLength(1);
    // A view-key-only scanner can't attribute the transfer to its real sender;
    // it must not report the recipient's own address instead.
    expect(inbound[0].sender).not.toBe(recipient.address);
  });
});

describe("v2 handlers and indexer", () => {
  it("shapes blocks/latest the way lastBlock reads it", async () => {
    const block = await fetchLatestBlockV2();
    expect(typeof block.block_hash).toBe("string");
    expect(typeof block.previous_hash).toBe("string");
    expect(block.header.metadata.height).toBeGreaterThanOrEqual(1);
    expect(typeof block.header.metadata.timestamp).toBe("number");
  });

  it("passes the credits mapping through, null for an unknown address", async () => {
    await expect(fetchAccountBalanceV2(GENESIS_ACCOUNT.address)).resolves.toMatch(/u64$/);
    await expect(fetchAccountBalanceV2(RECIPIENT_ACCOUNT.address)).resolves.toBeNull();
  });

  it("emits one row per indexed credits.aleo transition", async () => {
    // Relies on earlier tests in this file having sent transfer_public to PROBE_ADDRESS.
    const rows = await scanIndexedTransfers();
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      expect(row.program_id).toBe("credits.aleo");
      expect(["transfer_public", "transfer_public_to_private"]).toContain(row.function_id);
      expect(row.transaction_status).toBe("Accepted");
      expect(row.sender_address).toBe(GENESIS_ACCOUNT.address);
      // transfer_public_to_private takes its recipient as address.private, so the
      // row carries a ciphertext there rather than a bare address.
      const recipientPrefix = row.function_id === "transfer_public" ? "aleo1" : "ciphertext1";
      expect(row.recipient_address.startsWith(recipientPrefix)).toBe(true);
      expect(row.amount).toBeGreaterThan(0);
      expect(row.fee).toBeGreaterThan(0);
      // Unix seconds as a string: parseTransactionFields does Number(...) * 1000.
      expect(row.block_timestamp).toMatch(/^\d+$/);
      expect(new Date(Number(row.block_timestamp) * 1000).toString()).not.toBe("Invalid Date");
      // The genesis block carries four transfer_public_to_private rows: the
      // devnet's initial distribution of private credits.
      expect(row.block_number).toBeGreaterThanOrEqual(0);
    }
  });

  it("filters rows by address on either side of the transfer", async () => {
    const sent = await getAccountTransactionRows(GENESIS_ACCOUNT.address);
    const received = await getAccountTransactionRows(PROBE_ADDRESS);
    expect(sent.length).toBeGreaterThan(0);
    expect(received.length).toBeGreaterThan(0);
    expect(received.every(row => row.recipient_address === PROBE_ADDRESS)).toBe(true);
  });

  it("returns an empty list for an address the chain never saw", async () => {
    await expect(getAccountTransactionRows(RECIPIENT_ACCOUNT.address)).resolves.toStrictEqual([]);
  });

  it("shapes transactions/{id} with the block fields the details type demands", async () => {
    const [row] = await scanIndexedTransfers();
    const details = await fetchTransactionV2(row.transaction_id);

    expect(details.id).toBe(row.transaction_id);
    expect(details.status).toBe("Accepted");
    expect(details.block_height).toBe(row.block_number);
    expect(details.block_hash).toBe(row.block_hash);
    expect(details.block_timestamp).toBe(row.block_timestamp);
    expect(details.fee_value).toBe(row.fee);
    expect(details.execution.transitions.length).toBeGreaterThan(0);
    expect(details.fee.transition.function).toMatch(/^fee_/);
  });

  it("indexes a stablecoin transfer_public row with the sender read from argument 2, not argument 0", async () => {
    // GENESIS_ACCOUNT already holds the admin role from deployTokenPrograms's
    // beforeAll — mint directly to a fresh recipient so this row's sender
    // (GENESIS_ACCOUNT) and recipient are unambiguous.
    const recipientAccount = await generateAleoAccount();
    await mintTokens({
      admin: GENESIS_ACCOUNT,
      holder: recipientAccount.address,
      amount: 1_000_000n,
    });

    const rows = await getAccountTransactionRows(GENESIS_ACCOUNT.address);
    const mintRow = rows.find(
      row => row.program_id === TOKEN_PROGRAM_ID && row.function_id === "mint_public",
    );

    expect(mintRow).toBeDefined();
    // The catching bug this guards against: reading future argument 0 would read
    // the *recipient* here and misreport sender_address === recipient_address.
    expect(mintRow?.sender_address).toBe(GENESIS_ACCOUNT.address);
    expect(mintRow?.sender_address).not.toBe(recipientAccount.address);
  });
});

describe("private account fixture", () => {
  it("seeds lastPrivateSyncDate so the account is eligible for a combined sync", () => {
    const account = makePrivateAleoAccount(GENESIS_ACCOUNT.address, GENESIS_ACCOUNT.viewKey);

    expect(account.aleoResources?.lastPrivateSyncDate).toBeInstanceOf(Date);
    // Strictly in the past, so a test may assert a sync moved the date forward.
    expect(account.aleoResources!.lastPrivateSyncDate!.getTime()).toBeLessThan(Date.now());
    expect(account.aleoResources?.provableApi).toBeNull();
    expect(account.aleoResources?.privateBalance).toBeNull();
    expect(account.aleoResources?.unspentPrivateRecords).toBeNull();
  });

  it("sizes RECORD_A and RECORD_B so both selections are deterministic", () => {
    // selectPrivateRecordsForAmount takes the smallest record that covers the
    // amount, so A must cover it and B must not — otherwise B is picked as the
    // amount record and the fee record is whichever one is left.
    expect(RECORD_A_MICROCREDITS).toBeGreaterThan(TRANSFER_AMOUNT_MICROCREDITS);
    expect(RECORD_B_MICROCREDITS).toBeLessThan(TRANSFER_AMOUNT_MICROCREDITS);
    // B is what validatePrivateFeeRecord checks against the billed base fee.
    expect(RECORD_B_MICROCREDITS).toBeGreaterThan(TRANSFER_PRIVATE_BASE_FEE);
  });
});

/**
 * Mints a private credits record for `recipient` outside the bridge, via a
 * proofless `transfer_public_to_private` broadcast to the devnode. Returns
 * the minting transaction's id.
 */
async function mintPrivateRecord(recipient: string, amount: number): Promise<string> {
  const wasm = await loadAleoWasm();
  const transaction = await wasm.ProgramManagerBase.buildDevnodeExecutionTransaction(
    wasm.PrivateKey.from_string(GENESIS_ACCOUNT.privateKey),
    await getProgramSource("credits.aleo"),
    "transfer_public_to_private",
    [recipient, `${amount}u64`],
    0,
    undefined,
    ALEO_LOCAL_NODE,
  );
  await broadcastTransaction(transaction.toString());
  // One more empty block, so the mint is behind the tip before the store's
  // watermark-driven scan reads it.
  await advanceBlocks(1);
  return transaction.id();
}

describe("record store", () => {
  const amount = 4_000_000;

  it("scans a minted record, tracks it incrementally, and ignores other accounts", async () => {
    const owner = await generateAleoAccount();
    const stranger = await generateAleoAccount();

    const mintId = await mintPrivateRecord(owner.address, amount);
    const mintedCommitment = await mintedRecordCommitment(mintId);

    const store = createRecordStore({ viewKey: owner.viewKey, address: owner.address });
    await store.refresh();

    const records = store.list();
    expect(records).toHaveLength(1);

    const [record] = records;
    // Ground truth for the commitment is read straight off the chain, never
    // derived: @provablehq/wasm gets a record's own commitment derivation wrong.
    expect(record.commitment).toBe(mintedCommitment);
    expect(record.spent).toBe(false);
    expect(record.program_name).toBe("credits.aleo");
    expect(record.record_name).toBe("credits");
    expect(record.owner).toBe(owner.address);

    expect(store.plaintextByCommitment(record.commitment)).toMatch(/^\{/);

    const watermarkAfterFirstRefresh = store.watermark;
    const blocksFetchedAfterFirstRefresh = store.blocksFetched;
    await advanceBlocks(1);
    await store.refresh();

    expect(store.watermark).toBeGreaterThan(watermarkAfterFirstRefresh);
    expect(store.list()).toHaveLength(1);
    // Proves the scan is incremental: only the one new block is fetched, not
    // the whole chain (dozens of blocks deep by this point).
    expect(store.blocksFetched - blocksFetchedAfterFirstRefresh).toBe(1);

    const blocksFetchedBeforeStrangerMint = store.blocksFetched;
    // mintPrivateRecord seals two blocks: one on broadcast, one from its own
    // advanceBlocks(1) call.
    await mintPrivateRecord(stranger.address, amount);
    await store.refresh();

    expect(store.list()).toHaveLength(1);
    expect(store.list()[0].owner).toBe(owner.address);
    expect(store.blocksFetched - blocksFetchedBeforeStrangerMint).toBe(2);
  });
});

/** Encrypts a registration envelope against the real backend, a dummy X25519 key. */
async function encryptRegistration(
  publicKey: Uint8Array,
  viewKey: string,
  start = 0,
): Promise<string> {
  const { encrypted } = await postSdk<{ encrypted: string }>("/encrypt_registration", {
    public_key: Buffer.from(publicKey).toString("base64"),
    view_key: viewKey,
    start,
  });
  return encrypted;
}

describe("scanner registration", () => {
  it("encrypts a registration envelope the recipient can open into the view key bytes", async () => {
    await sodium.ready;
    const dummy = sodium.crypto_box_keypair();

    const encrypted = await encryptRegistration(dummy.publicKey, GENESIS_ACCOUNT.viewKey);
    const opened = sodium.crypto_box_seal_open(
      Buffer.from(encrypted, "base64"),
      dummy.publicKey,
      dummy.privateKey,
    );

    expect(opened).toHaveLength(36);

    const wasm = await loadAleoWasm();
    const viewKeyBytes = wasm.ViewKey.from_string(GENESIS_ACCOUNT.viewKey).toBytesLe();
    expect(Array.from(opened.slice(0, 32))).toStrictEqual(Array.from(viewKeyBytes));
  });

  it("binds register/encrypted to the right account and serves only its own records/owned", async () => {
    const owner = await generateAleoAccount();
    const stranger = await generateAleoAccount();
    const amount = 5_000_000;
    await mintPrivateRecord(owner.address, amount);
    await mintPrivateRecord(stranger.address, amount);

    const scanner = createFakeScanner();
    await scanner.setup();
    scanner.registerAccount({ viewKey: owner.viewKey, address: owner.address });
    scanner.registerAccount({ viewKey: stranger.viewKey, address: stranger.address });

    const { public_key } = scanner.pubkey();
    const publicKeyBytes = Buffer.from(public_key, "base64");

    const ownerEnvelope = await encryptRegistration(publicKeyBytes, owner.viewKey);
    const { uuid: ownerUuid } = await scanner.register(ownerEnvelope);

    const strangerEnvelope = await encryptRegistration(publicKeyBytes, stranger.viewKey);
    const { uuid: strangerUuid } = await scanner.register(strangerEnvelope);

    const ownerRecords = await scanner.ownedRecords(ownerUuid);
    expect(ownerRecords).toHaveLength(1);
    expect(ownerRecords[0].owner).toBe(owner.address);

    const strangerRecords = await scanner.ownedRecords(strangerUuid);
    expect(strangerRecords).toHaveLength(1);
    expect(strangerRecords[0].owner).toBe(stranger.address);
  });

  it("errors on an unknown uuid instead of serving an empty list", async () => {
    const scanner = createFakeScanner();
    await scanner.setup();

    await expect(scanner.ownedRecords("not-a-real-uuid")).rejects.toThrow(/uuid/i);
  });
});

describe("Aleo transfer_public scenario", () => {
  it("sends public credits through the bridge", async () => {
    await executeScenario(scenarioTransferPublic);
  });
});

describe("Aleo send-max public scenario", () => {
  it("sends all public microcredits through the bridge", async () => {
    await executeScenario(scenarioSendMaxPublic);
  });
});

describe("Aleo transfer_private scenario", () => {
  it("shields, then sends private credits through the bridge", async () => {
    await executeScenario(scenarioTransferPrivate);
  });
});

describe("Aleo send-max private scenario", () => {
  /**
   * Blocked on this package's own TLV decoder. A 14-record transfer runs
   * through the batcher program, which passes the credits records to
   * credits.aleo as `external_record` inputs, and `decodeInputType`
   * (`src/tlv/decodeRequest.ts:98`) rejects that discriminant. The bridge
   * itself reaches the signer: the scenario clears prepare and
   * getTransactionStatus.
   */
  it.skip("sends all private microcredits above the smallest of 15 records through the bridge", async () => {
    await executeScenario(scenarioSendMaxPrivate);
  });
});

describe("Aleo transfer_private_to_public scenario", () => {
  it("unshields private credits back to the public balance through the bridge", async () => {
    await executeScenario(scenarioTransferPrivateToPublic);
  });
});

describe("Aleo transfer_token_public scenario", () => {
  it("sends a public ARC-22 token transfer through the bridge", async () => {
    await executeScenario(scenarioTransferTokenPublic);
  });
});

describe("private sync end to end", () => {
  it("syncs a minted private record through the real bridge and the fake scanner", async () => {
    const owner = await generateAleoAccount();
    const amount = 6_000_000;

    // Minted outside the bridge, on the devnode directly: ground truth for the
    // assertions below.
    await mintPrivateRecord(owner.address, amount);

    const scanner = createFakeScanner();
    await scanner.setup();
    scanner.registerAccount({ viewKey: owner.viewKey, address: owner.address });

    const mockServer = setupServer(
      ...buildAleoHandlers({ recipient: owner.address, amount }),
      ...buildScannerHandlers(scanner),
    );
    mockServer.listen({
      onUnhandledRequest: request => {
        const { hostname } = new URL(request.url);
        // Localhost is the real SDK backend and devnode; everything else must be
        // handled here or fail loudly.
        if (["127.0.0.1", "localhost"].includes(hostname)) return;
        throw new Error(`Unhandled request: ${request.method} ${request.url}`);
      },
    });

    try {
      const signer = buildMockAleoSigner(owner.privateKey);
      const { accountBridge } = getBridges(signer, buildAleoCoinConfig());
      const account = makePrivateAleoAccount(owner.address, owner.viewKey);
      const preSyncDate = account.aleoResources!.lastPrivateSyncDate!;

      const synced = await firstValueFrom(
        accountBridge
          .sync(account, { paginationConfig: {} })
          .pipe(reduce((acc, applyPatch) => applyPatch(acc), account)),
      );

      expect(synced.aleoResources?.privateBalance).toStrictEqual(new BigNumber(amount));
      expect(synced.aleoResources?.unspentPrivateRecords).toHaveLength(1);
      expect(synced.aleoResources?.provableApi?.uuid).toBeTruthy();
      expect(synced.aleoResources?.lastPrivateSyncDate?.getTime()).toBeGreaterThan(
        preSyncDate.getTime(),
      );

      const privateOperations = (synced.operations as AleoOperation[]).filter(
        op => op.extra.transactionType === "private",
      );
      expect(privateOperations).toHaveLength(1);
      const [privateOperation] = privateOperations;
      expect(privateOperation.type).toBe("IN");
      expect(privateOperation.hasFailed).toBeFalsy();
      expect(privateOperation.recipients).toStrictEqual([owner.address]);
      expect(privateOperation.senders).toStrictEqual([GENESIS_ACCOUNT.address]);
      expect(privateOperation.value).toStrictEqual(new BigNumber(amount));
    } finally {
      mockServer.close();
    }
  });
});
