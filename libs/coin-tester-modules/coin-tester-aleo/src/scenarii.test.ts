import BigNumber from "bignumber.js";
import { setupServer } from "msw/node";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killStack, spawnStack, registerTeardownHooks } from "./stack";
import { scenarioTransferPublic } from "./scenarii/transferPublic";
import { scenarioSendMaxPublic } from "./scenarii/sendMaxPublic";
import { scenarioTransferPrivate } from "./scenarii/transferPrivate";
import { scenarioTransferPrivateToPublic } from "./scenarii/transferPrivateToPublic";
import { assertGenesisAccountIsFunded, generateAleoAccount, PROBE_ADDRESS } from "./fixtures";
import { buildMockAleoSigner } from "./signer";
import { readTlv, TLV_TAG } from "./tlv/tags";
import type { AleoWasm } from "./wasm";
import {
  advanceBlocks,
  getProgramSource,
  getLatestHeight,
  getBlock,
  getPublicBalance,
  broadcastTransaction,
  getTransaction,
} from "./devnode";
import { loadAleoWasm } from "./wasm";
import { ALEO_LOCAL_NODE, ALEO_LOCAL_SDK } from "./constants";
import {
  GENESIS_ACCOUNT,
  RECIPIENT_ACCOUNT,
  TRANSFER_AMOUNT_MICROCREDITS,
  RECORD_A_MICROCREDITS,
  buildAleoCoinConfig,
  makePrivateAleoAccount,
} from "./fixtures";
import type { GeneratedAleoAccount } from "./fixtures";
import { getBridges } from "./helpers";
import { mintPrivateRecord } from "./mint";
import type { AleoOperation } from "@ledgerhq/coin-aleo/types";
import { buildTransaction, handleProve, verifyAuthorizations } from "./msw/prove";
import { getAccountTransactionRows, scanIndexedTransfers } from "./msw/indexer";
import { fetchAccountBalanceV2, fetchLatestBlockV2, fetchTransactionV2 } from "./msw/node";
import {
  correctRecordVersion,
  createRecordStore,
  makeRecordResolver,
  type RecordStore,
} from "./msw/records";
import { createFakeScanner } from "./msw/scanner";
import { ensureSponsor, getSponsoredFee, reimburseFee } from "./msw/sponsor";
import { buildAleoHandlers, buildScannerHandlers } from "./msw/handlers";
import { startMockServer, syncAccount } from "./testSetup";
import sodium from "libsodium-wrappers";

jest.setTimeout(600_000);

registerTeardownHooks();

beforeAll(
  async () => {
    await spawnStack();
  },
  10 * 60 * 1000,
);

afterAll(async () => {
  await killStack();
});

describe("Aleo devnode", () => {
  it("serves a ledger", async () => {
    const height = await getLatestHeight();
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
      // Sponsored, as signOperation sends it: estimateFees returns 0.
      fee: { function_name: "fee_public", max_base_fee: "0", max_priority_fee: "0" },
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

  it("refuses to sign a fee intent, which the bridge never requests under sponsorship", async () => {
    await expect(signer.signFeeIntent(Buffer.alloc(0))).rejects.toThrow(
      /never signed under sponsorship/,
    );
  });

  it("signs a transfer_public_to_private root intent the backend accepts, exercising address.private", async () => {
    const request = await postSdk<PreparedRequest>("/transactions/request", {
      intent: {
        type: "transfer_public_to_private",
        amount: String(TRANSFER_AMOUNT_MICROCREDITS),
        to: RECIPIENT_ACCOUNT.address,
      },
      fee: { function_name: "fee_public", max_base_fee: "0", max_priority_fee: "0" },
      view_key: GENESIS_ACCOUNT.viewKey,
    });

    const { signature } = await signer.signRootIntent("", Buffer.from(request.tlv, "hex"));

    const authorization = await postSdk<{ authorization: unknown; execution_id: string }>(
      "/transactions/authorization",
      { request, signatures: [signature], view_key: GENESIS_ACCOUNT.viewKey },
    );

    expect(authorization.authorization).toBeTruthy();
  });

  it("refuses a nested call before a root intent supplied the root tvk", async () => {
    // Without the root tvk the backend's scm check would only fail much later, inside aleo-backend.
    const freshSigner = buildMockAleoSigner(GENESIS_ACCOUNT.privateKey);

    await expect(freshSigner.signNestedCall(Buffer.alloc(0))).rejects.toThrow(
      /signNestedCall ran before signRootIntent/,
    );
  });
});

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
      fee: { function_name: "fee_private", max_base_fee: "0", max_priority_fee: "0" },
      view_key: owner.viewKey,
    });

    // Ground truth: the chain's own commitment, decoded the same way the TLV decoder does.
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

    const signerWithResolver = buildMockAleoSigner(owner.privateKey, makeRecordResolver(store));
    const { signature } = await signerWithResolver.signRootIntent(
      "",
      Buffer.from(request.tlv, "hex"),
    );

    const decodedSignature = decodeSignatureGammas(signature);
    expect(decodedSignature.gammasCount).toBe(1);
    expect(decodedSignature.gammas).toHaveLength(1);
    expect(decodedSignature.gammas[0]).toHaveLength(32);

    // Proves the record layout and gammas agree with the backend, not just with each other.
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

    const transaction = await wasm.ProgramManagerBase.buildDevnodeExecutionTransaction(
      wasm.PrivateKey.from_string(GENESIS_ACCOUNT.privateKey),
      await getProgramSource("credits.aleo"),
      "transfer_public",
      [PROBE_ADDRESS, `${amount}u64`],
      0,
      undefined,
      // The wasm client appends `/${network}/...` itself; a network-qualified base would 404.
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
});

async function buildAuthorizations(recipient: string, amount: number) {
  const signer = buildMockAleoSigner(GENESIS_ACCOUNT.privateKey);

  const rootRequest = await postSdk<PreparedRequest>("/transactions/request", {
    intent: { type: "transfer_public", amount: String(amount), to: recipient },
    fee: { function_name: "fee_public", max_base_fee: "0", max_priority_fee: "0" },
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

  return {
    body: { authorization: root.authorization, broadcast: true },
    executionId: root.execution_id,
  };
}

async function buildFeeAuthorization(executionId: string): Promise<Record<string, unknown>> {
  const wasm = await loadAleoWasm();
  const authorization = await wasm.ProgramManagerBase.authorizeFee(
    wasm.PrivateKey.from_string(GENESIS_ACCOUNT.privateKey),
    executionId,
    0.03406,
    0,
  );
  return JSON.parse(authorization.toString()) as Record<string, unknown>;
}

describe("prove handler", () => {
  const amount = 3_000_000;

  it("verifies the authorization and that no fee authorization is attached", async () => {
    const { body } = await buildAuthorizations(PROBE_ADDRESS, amount);
    await expect(
      verifyAuthorizations(body, { recipient: PROBE_ADDRESS, amount }),
    ).resolves.toBeUndefined();
    await expect(
      verifyAuthorizations(
        { ...body, fee_authorization: null },
        { recipient: PROBE_ADDRESS, amount },
      ),
    ).resolves.toBeUndefined();
  });

  it("rejects a swapped recipient", async () => {
    const { body } = await buildAuthorizations(PROBE_ADDRESS, amount);
    await expect(
      verifyAuthorizations(body, { recipient: RECIPIENT_ACCOUNT.address, amount }),
    ).rejects.toThrow(/recipient/i);
  });

  it("rejects a swapped amount", async () => {
    const { body } = await buildAuthorizations(PROBE_ADDRESS, amount);
    await expect(
      verifyAuthorizations(body, { recipient: PROBE_ADDRESS, amount: amount + 1 }),
    ).rejects.toThrow(/amount/i);
  });

  it("rejects a request whose signed amount was tampered with", async () => {
    const { body } = await buildAuthorizations(PROBE_ADDRESS, amount);
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

  it("rejects an attached fee authorization", async () => {
    const { body, executionId } = await buildAuthorizations(PROBE_ADDRESS, amount);
    await expect(
      verifyAuthorizations(
        { ...body, fee_authorization: await buildFeeAuthorization(executionId) },
        { recipient: PROBE_ADDRESS, amount },
      ),
    ).rejects.toThrow(/unexpected fee authorization/i);
  });

  it("builds and broadcasts a transaction the devnode confirms", async () => {
    const before = await getPublicBalance(PROBE_ADDRESS);
    const { id } = await buildTransaction({ recipient: PROBE_ADDRESS, amount });
    await advanceBlocks(1);

    expect(await getPublicBalance(PROBE_ADDRESS)).toBe(before + BigInt(amount));
    await expect(getTransaction(id)).resolves.toMatchObject({ id });
  });

  it("answers the shape logic/broadcast.ts reads, and charges the signer the amount only", async () => {
    // Funded ahead of the measurement: the first sponsored call funds the sponsor from genesis.
    await ensureSponsor();
    const { body } = await buildAuthorizations(PROBE_ADDRESS, amount);
    const before = await getPublicBalance(GENESIS_ACCOUNT.address);

    const response = await handleProve(body, { recipient: PROBE_ADDRESS, amount });
    await advanceBlocks(1);

    expect(typeof response.transaction.id).toBe("string");
    expect(response.transaction.id.startsWith("at1")).toBe(true);
    expect(response.broadcast_result.status).toBe("Accepted");
    expect(await getPublicBalance(GENESIS_ACCOUNT.address)).toBe(before - BigInt(amount));
    expect(getSponsoredFee(response.transaction.id)).toBeGreaterThan(0);
  });
});

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

// Mints RECORD_A for `owner` first, then signs a transfer_private spending it.
async function buildPrivateAuthorizations(
  owner: GeneratedAleoAccount,
  recipient: string,
  amount: number,
): Promise<{
  authorization: Record<string, unknown>;
  broadcast: true;
  executionId: string;
  store: RecordStore;
}> {
  const wasm = await loadAleoWasm();

  const amountMintId = await mintPrivateRecord(owner.address, RECORD_A_MICROCREDITS);
  const amountCommitment = await mintedRecordCommitment(amountMintId);

  const store = createRecordStore({ viewKey: owner.viewKey, address: owner.address });
  await store.refresh();

  const amountPlaintext = store.plaintextByCommitment(amountCommitment);
  if (!amountPlaintext) {
    throw new Error("test setup: store has no plaintext for a just-minted record");
  }

  const signer = buildMockAleoSigner(owner.privateKey, makeRecordResolver(store));

  const rootRequest = await postSdk<PreparedRequest>("/transactions/request", {
    intent: {
      type: "transfer_private",
      amount: String(amount),
      to: recipient,
      record: recordPlaintextToContent(amountPlaintext, wasm),
    },
    fee: { function_name: "fee_private", max_base_fee: "0", max_priority_fee: "0" },
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

  return {
    authorization: root.authorization,
    broadcast: true,
    executionId: root.execution_id,
    store,
  };
}

describe("prove handler private transfer", () => {
  const amount = 1_000_000;

  it("verifies the authorization and that no fee authorization is attached", async () => {
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

  it("rejects an attached fee authorization", async () => {
    const owner = await generateAleoAccount();
    const body = await buildPrivateAuthorizations(owner, PROBE_ADDRESS, amount);
    await expect(
      verifyAuthorizations(
        { ...body, fee_authorization: await buildFeeAuthorization(body.executionId) },
        { recipient: PROBE_ADDRESS, amount },
      ),
    ).rejects.toThrow(/unexpected fee authorization/i);
  });

  it("broadcasts a transaction the devnode confirms, spending one record and leaving one change record", async () => {
    const owner = await generateAleoAccount();
    const body = await buildPrivateAuthorizations(owner, PROBE_ADDRESS, amount);

    const spentCommitments = new Set(
      body.store.list({ unspent: true }).map(record => record.commitment),
    );
    expect(spentCommitments.size).toBe(1);

    const { transaction } = await handleProve(body, {
      recipient: PROBE_ADDRESS,
      amount,
      senderPrivateKey: owner.privateKey,
      privateRecordStore: body.store,
    });
    await advanceBlocks(1);
    await body.store.refresh();

    await expect(getTransaction(transaction.id)).resolves.toMatchObject({ id: transaction.id });

    const originals = body.store.list().filter(record => spentCommitments.has(record.commitment));
    expect(originals).toHaveLength(1);
    expect(originals.every(record => record.spent)).toBe(true);

    const newUnspent = body.store.list({ unspent: true });
    expect(newUnspent).toHaveLength(1);
    expect(spentCommitments.has(newUnspent[0].commitment)).toBe(false);

    // A change record is a self-spend, so sender must be the owner, not the "no future" fallback "".
    expect(newUnspent[0].sender).toBe(owner.address);

    // The sponsor paid the fee back, so the owner's public balance is untouched.
    expect(await getPublicBalance(owner.address)).toBe(0n);
  });

  it("lets a genuine recipient scan its inbound record without throwing or mistaking it for a self-spend", async () => {
    const sender = await generateAleoAccount();
    const recipient = await generateAleoAccount();
    const body = await buildPrivateAuthorizations(sender, recipient.address, amount);

    await handleProve(body, {
      recipient: recipient.address,
      amount,
      senderPrivateKey: sender.privateKey,
      privateRecordStore: body.store,
    });
    await advanceBlocks(1);

    const recipientStore = createRecordStore({
      viewKey: recipient.viewKey,
      address: recipient.address,
    });
    await expect(recipientStore.refresh()).resolves.toBeUndefined();

    const inbound = recipientStore.list({ unspent: true });
    expect(inbound).toHaveLength(1);
    // A view-key-only scanner can't know the real sender, but must not report the recipient.
    expect(inbound[0].sender).not.toBe(recipient.address);
  });
});

describe("v2 handlers and indexer", () => {
  beforeAll(async () => {
    await buildTransaction({ recipient: PROBE_ADDRESS, amount: TRANSFER_AMOUNT_MICROCREDITS });
    await advanceBlocks(1);
  });

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
    const rows = await scanIndexedTransfers();
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      expect(row.program_id).toBe("credits.aleo");
      expect(["transfer_public", "transfer_public_to_private"]).toContain(row.function_id);
      expect(row.transaction_status).toBe("Accepted");
      expect(row.sender_address).toBe(GENESIS_ACCOUNT.address);
      // transfer_public_to_private's recipient is address.private, so the row holds a ciphertext.
      const recipientPrefix = row.function_id === "transfer_public" ? "aleo1" : "ciphertext1";
      expect(row.recipient_address.startsWith(recipientPrefix)).toBe(true);
      expect(row.amount).toBeGreaterThan(0);
      expect(row.fee).toBeGreaterThan(0);
      // Unix seconds as a string: parseTransactionFields does Number(...) * 1000.
      expect(row.block_timestamp).toMatch(/^\d+$/);
      expect(new Date(Number(row.block_timestamp) * 1000).toString()).not.toBe("Invalid Date");
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

  it("hides sponsor reimbursement rows", async () => {
    const payer = await generateAleoAccount();
    await reimburseFee(payer.address, 12_345);

    // The reimbursement moved the balance, but a real fee master leaves no transfer behind.
    expect(await getPublicBalance(payer.address)).toBe(12_345n);
    await expect(getAccountTransactionRows(payer.address)).resolves.toStrictEqual([]);
  });
});

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
    // Read off the chain, never derived: @provablehq/wasm derives record commitments wrong.
    expect(record.commitment).toBe(mintedCommitment);
    expect(record.spent).toBe(false);
    expect(record.program_name).toBe("credits.aleo");
    expect(record.record_name).toBe("credits");
    expect(record.owner).toBe(owner.address);

    expect(store.plaintextByCommitment(record.commitment)).toMatch(/^\{/);

    const watermarkAfterFirstRefresh = store.watermark;
    const blocksScannedAfterFirstRefresh = store.blocksScanned;
    await advanceBlocks(1);
    await store.refresh();

    expect(store.watermark).toBeGreaterThan(watermarkAfterFirstRefresh);
    expect(store.list()).toHaveLength(1);
    expect(store.blocksScanned - blocksScannedAfterFirstRefresh).toBe(1);

    const blocksScannedBeforeStrangerMint = store.blocksScanned;
    // mintPrivateRecord seals two blocks: one on broadcast, one from advanceBlocks(1).
    await mintPrivateRecord(stranger.address, amount);
    await store.refresh();

    expect(store.list()).toHaveLength(1);
    expect(store.list()[0].owner).toBe(owner.address);
    expect(store.blocksScanned - blocksScannedBeforeStrangerMint).toBe(2);
  });
});

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

describe("Aleo transfer_private_to_public scenario", () => {
  it("unshields private credits back to the public balance through the bridge", async () => {
    await executeScenario(scenarioTransferPrivateToPublic);
  });
});

describe("private sync end to end", () => {
  it("syncs a minted private record through the real bridge and the fake scanner", async () => {
    const owner = await generateAleoAccount();
    const amount = 6_000_000;

    await mintPrivateRecord(owner.address, amount);

    const scanner = createFakeScanner();
    await scanner.setup();
    scanner.registerAccount({ viewKey: owner.viewKey, address: owner.address });

    const mockServer = setupServer(
      ...buildAleoHandlers({ recipient: owner.address, amount }),
      ...buildScannerHandlers(scanner),
    );
    startMockServer(mockServer);

    try {
      const signer = buildMockAleoSigner(owner.privateKey);
      const { accountBridge } = getBridges(signer, buildAleoCoinConfig());
      const account = makePrivateAleoAccount(owner.address, owner.viewKey);
      const preSyncDate = account.aleoResources!.lastPrivateSyncDate!;

      const synced = await syncAccount(accountBridge, account);

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
