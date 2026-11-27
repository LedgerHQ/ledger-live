import assert from "node:assert/strict";
import test from "node:test";
import { Signature, Wallet } from "ethers";
import type { PerpsTransaction } from "./perpsApi";
import type { HyperliquidSignature } from "./perpsSignature";
import { signTransactions, type HyperliquidDevice } from "./perpsSigning";

const domain = {
  name: "Exchange",
  version: "1",
  chainId: 1337,
  verifyingContract: `0x${"0".repeat(40)}`,
};
const agentTypes = {
  Agent: [
    { name: "source", type: "string" },
    { name: "connectionId", type: "bytes32" },
  ],
};

const wallet = Wallet.createRandom();

function transaction(id: string, connectionByte: string): PerpsTransaction {
  return {
    id,
    signingFormat: "EIP712_TYPED_DATA",
    signablePayload: {
      domain,
      types: agentTypes,
      message: { source: "a", connectionId: `0x${connectionByte.repeat(32)}` },
    },
    rawPayload: { action: { type: "order" }, nonce: Number(connectionByte) },
  };
}

async function signatureOf(tx: PerpsTransaction): Promise<HyperliquidSignature> {
  const message = tx.signablePayload?.message as Record<string, unknown>;
  const { r, s, v } = Signature.from(await wallet.signTypedData(domain, agentTypes, message));
  return { r, s, v };
}

type FakeDevice = HyperliquidDevice & { calls: number; signal?: AbortSignal };

function fakeDevice(overrides: Partial<HyperliquidDevice> = {}): FakeDevice {
  const device: FakeDevice = {
    calls: 0,
    isShowingReview: async () => false,
    signActions: async () => [],
    approveReview: async () => undefined,
    ...overrides,
  };
  const { signActions } = device;
  device.signActions = async (metadata, payloads, signal) => {
    device.calls++;
    device.signal = signal;
    return signActions(metadata, payloads, signal);
  };
  return device;
}

const txs = [transaction("t1", "11"), transaction("t2", "22")];

test("signTransactions signs every transaction in one device call", async () => {
  const signatures = await Promise.all(txs.map(signatureOf));
  let received: Record<string, unknown>[] = [];
  const device = fakeDevice({
    signActions: async (_metadata, payloads) => {
      received = payloads;
      return signatures;
    },
  });

  const hex = await signTransactions(device, {
    address: wallet.address,
    signedMetadata: "0x01",
    transactions: txs,
  });

  assert.equal(device.calls, 1);
  assert.deepEqual(received, [txs[0].rawPayload, txs[1].rawPayload]);
  assert.equal(hex.length, 2);
});

test("signTransactions rejects a signature from another address", async () => {
  const signatures = await Promise.all(txs.map(signatureOf));
  const device = fakeDevice({ signActions: async () => signatures });
  await assert.rejects(
    signTransactions(device, {
      address: Wallet.createRandom().address,
      signedMetadata: "0x01",
      transactions: txs,
    }),
    /Signed by/,
  );
});

test("signTransactions rejects a missing signature", async () => {
  const device = fakeDevice({ signActions: async () => [await signatureOf(txs[0])] });
  await assert.rejects(
    signTransactions(device, {
      address: wallet.address,
      signedMetadata: "0x01",
      transactions: txs,
    }),
    /Expected 2 signatures, got 1/,
  );
});

test("signTransactions refuses another signing format before the device", async () => {
  const device = fakeDevice();
  await assert.rejects(
    signTransactions(device, {
      address: wallet.address,
      signedMetadata: "0x01",
      transactions: [{ ...txs[0], signingFormat: "RAW" }],
    }),
    /Unsupported signing format RAW/,
  );
  assert.equal(device.calls, 0);
});

test("signTransactions refuses a transaction without a raw payload", async () => {
  const device = fakeDevice();
  await assert.rejects(
    signTransactions(device, {
      address: wallet.address,
      signedMetadata: "0x01",
      transactions: [{ ...txs[0], rawPayload: undefined }],
    }),
    /has no raw payload/,
  );
  assert.equal(device.calls, 0);
});

test("signTransactions refuses when a review is already on screen", async () => {
  const device = fakeDevice({ isShowingReview: async () => true });
  await assert.rejects(
    signTransactions(device, {
      address: wallet.address,
      signedMetadata: "0x01",
      transactions: txs,
    }),
    /already shows a review/,
  );
  assert.equal(device.calls, 0);
});

test("signTransactions aborts the device signing when the approval fails", async () => {
  const device = fakeDevice({
    signActions: (_metadata, _payloads, signal) =>
      new Promise((_resolve, reject) =>
        signal.addEventListener("abort", () => reject(signal.reason)),
      ),
    approveReview: async () => {
      throw new Error("Review message not found");
    },
  });
  await assert.rejects(
    signTransactions(device, {
      address: wallet.address,
      signedMetadata: "0x01",
      transactions: txs,
    }),
    /Review message not found/,
  );
  assert.equal(device.signal?.aborted, true);
});

test("signTransactions stops the approval before failing on a signing error", async () => {
  let approvalStopped = false;
  const device = fakeDevice({
    signActions: async () => {
      throw new Error("Device locked");
    },
    approveReview: signal =>
      new Promise((_resolve, reject) =>
        signal.addEventListener("abort", () => {
          approvalStopped = true;
          reject(new Error("Approval stopped"));
        }),
      ),
  });
  await assert.rejects(
    signTransactions(device, {
      address: wallet.address,
      signedMetadata: "0x01",
      transactions: txs,
    }),
    /Device locked/,
  );
  assert.equal(approvalStopped, true);
});
