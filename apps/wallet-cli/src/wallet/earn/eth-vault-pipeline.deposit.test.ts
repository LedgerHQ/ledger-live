import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import type { AccountDescriptor } from "../models";
import type { CommandOutput } from "../../output";
import type { WalletAdapter } from "../index";
import { EarnApiError } from "./api";
import type { DefiProduct, EthTxStatus } from "./api.types";
import { activateEarnApiMock, deactivateEarnApiMock } from "./__test-helpers__/earn-api-mock";
import {
  activateSignBroadcastMock,
  deactivateSignBroadcastMock,
} from "./__test-helpers__/sign-and-broadcast-mock";

const PRODUCT = {
  id: "usdc-vault",
  chain: "eth",
  chain_id: 1,
  address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  vault: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  asset: "0xcccccccccccccccccccccccccccccccccccccccc",
  asset_symbol: "USDC",
  asset_decimals: 6,
} satisfies DefiProduct;

const APPROVE_TX = {
  wallet: "0x1111111111111111111111111111111111111111",
  to: PRODUCT.asset,
  data: "0x095ea7b3",
  value: "0",
  nonce: 0,
  gas_limit: 50_000,
  chain_id: 1,
};

const DEPOSIT_TX = {
  wallet: "0x1111111111111111111111111111111111111111",
  to: PRODUCT.vault,
  data: "0x6e553f65",
  value: "0",
  nonce: 1,
  gas_limit: 1_200_000,
  chain_id: 1,
};

// Drives the eth tx status poll. Each entry is a status to return, `{ throw: true }` to simulate a
// transient (retryable) transport error, or `{ throwApiError: true }` to simulate a non-retryable
// EarnApiError (4xx / contract violation). The last entry is repeated once exhausted so the default
// ("success") keeps the deposit/approve polls resolving immediately (no real sleep).
type StatusStep = EthTxStatus | { throw: true } | { throwApiError: true };
let statusSteps: StatusStep[] = ["success"];
let statusIndex = 0;

const getEthTxStatus = mock(async () => {
  const step = statusSteps[Math.min(statusIndex, statusSteps.length - 1)];
  statusIndex += 1;
  if (typeof step === "object" && "throwApiError" in step) {
    throw new EarnApiError("Earn API GET .../status failed: 400 (tx_hash=0xbad).");
  }
  if (typeof step === "object" && step.throw) {
    throw new Error("transient network blip");
  }
  return { data: { status: step as EthTxStatus } };
});

const postDefiApprove = mock(async () => ({ status: 200, kind: "transaction", data: APPROVE_TX }));
const postDefiDeposit = mock(async () => ({ status: 200, kind: "transaction", data: DEPOSIT_TX }));

// Capture the recipient of each broadcast leg so we can assert the approve -> deposit order, and hand
// back a distinct hash per leg.
const signAndBroadcastIntent = mock(async (params: { intent: { recipient: string } }) => ({
  txHash:
    params.intent.recipient.toLowerCase() === (PRODUCT.asset ?? "").toLowerCase()
      ? "0xapprovehash"
      : "0xdeposithash",
}));

// Scope these earn-api + sign-and-broadcast fakes to this file's tests only (see the mock helpers for
// the why — Bun's mock.module is process-global, so we gate the overrides behind an active flag).
beforeAll(() => {
  activateEarnApiMock({
    getDefiProducts: async () => [PRODUCT],
    postDefiApprove,
    postDefiDeposit,
    postDefiWithdraw: async () => {
      throw new Error("postDefiWithdraw should not be called");
    },
    getEthTxStatus,
  });
  activateSignBroadcastMock({
    signAndBroadcastIntent,
    prepareIntentDryRun: async () => ({}),
  });
});

const { depositEvm, pollEthTransactionStatus } = await import("./eth-vault-pipeline");

afterAll(() => {
  // Release this file's fakes so they don't bleed into sibling test files when the whole directory runs
  // in one bun process.
  deactivateEarnApiMock();
  deactivateSignBroadcastMock();
});

const descriptor = {
  id: "acc-1",
  currencyId: "ethereum",
  freshAddress: "0x1111111111111111111111111111111111111111",
} as unknown as AccountDescriptor;

const wallet = {
  prepareSend: async () => ({ amount: "0 ETH", fees: "0.0000272 ETH", recipient: PRODUCT.asset }),
} as unknown as WalletAdapter;

const out = {
  spin: () => null,
  sendEvent: () => {},
  sendComplete: () => {},
  sendDryRun: () => {},
  deviceState: () => {},
} as unknown as CommandOutput;

const device = { deviceId: "device-1", managerAppName: "Ethereum", deviceTimeoutMs: 1000 };

beforeEach(() => {
  statusSteps = ["success"];
  statusIndex = 0;
  signAndBroadcastIntent.mockClear();
  postDefiApprove.mockClear();
  postDefiDeposit.mockClear();
  getEthTxStatus.mockClear();
});

describe("depositEvm full broadcast path", () => {
  it("runs approve -> wait -> deposit -> status and broadcasts both legs in order", async () => {
    statusSteps = ["success"];
    const result = await depositEvm({
      descriptor,
      network: "ethereum:main",
      productId: PRODUCT.id,
      amount: "100 USDC",
      dryRun: false,
      wallet,
      out,
      device,
    });

    // Both legs were signed+broadcast, in approve-then-deposit order (asserted via the intent target).
    expect(signAndBroadcastIntent).toHaveBeenCalledTimes(2);
    const signedRecipients = signAndBroadcastIntent.mock.calls.map(
      call => (call[0] as { intent: { recipient: string } }).intent.recipient,
    );
    expect(signedRecipients).toEqual([PRODUCT.asset, PRODUCT.vault]);

    expect(result.transactions.map(t => t.kind)).toEqual(["approve", "deposit"]);
    const approve = result.transactions.find(t => t.kind === "approve");
    const deposit = result.transactions.find(t => t.kind === "deposit");
    expect(approve?.hash).toBe("0xapprovehash");
    expect(approve?.status).toBe("success");
    expect(deposit?.hash).toBe("0xdeposithash");
    expect(deposit?.status).toBe("success");
    expect(result.status).toBe("success");
  });
});

describe("depositEvm dry-run with a pending approve", () => {
  it("validates the approve but skips the deposit build instead of hitting the 500", async () => {
    const result = await depositEvm({
      descriptor,
      network: "ethereum:main",
      productId: PRODUCT.id,
      amount: "100 USDC",
      dryRun: true,
      wallet,
      out,
    });

    // Dry-run with a pending approve must not build the deposit leg (/v1/defi/deposit 500s at 0 allowance).
    expect(postDefiDeposit).not.toHaveBeenCalled();
    expect(result.dryRun).toBe(true);
    expect(result.transactions.map(t => t.kind)).toEqual(["approve", "deposit"]);

    const approve = result.transactions.find(t => t.kind === "approve");
    expect(approve?.status).toBe("dry-run");

    const deposit = result.transactions.find(t => t.kind === "deposit");
    expect(deposit?.status).toContain("not-simulated");
    expect(result.status).toContain("approve validated");
  });
});

describe("depositEvm chain guard", () => {
  it("refuses to sign when the account chain differs from the vault chain", async () => {
    const polygonDescriptor = {
      id: "acc-polygon",
      currencyId: "polygon",
      freshAddress: "0x1111111111111111111111111111111111111111",
    } as unknown as AccountDescriptor;

    await expect(
      depositEvm({
        descriptor: polygonDescriptor,
        network: "polygon:main",
        productId: PRODUCT.id,
        amount: "100 USDC",
        dryRun: false,
        wallet,
        out,
        device,
      }),
    ).rejects.toThrow(/is on chain id 137 but vault usdc-vault is on chain id 1/);

    expect(signAndBroadcastIntent).not.toHaveBeenCalled();
    expect(postDefiApprove).not.toHaveBeenCalled();
    expect(postDefiDeposit).not.toHaveBeenCalled();
  });
});

describe("pollEthTransactionStatus retry/terminal logic", () => {
  it("keeps polling through pending_confirmation until a terminal success", async () => {
    statusSteps = ["pending_confirmation", "pending_confirmation", "success"];
    statusIndex = 0;
    const status = await pollEthTransactionStatus("0xpending", { intervalMs: 0, attempts: 5 });
    expect(status).toBe("success");
    expect(getEthTxStatus).toHaveBeenCalledTimes(3);
  });

  it("treats a transport error as pending and recovers when the next poll succeeds", async () => {
    statusSteps = [{ throw: true }, "success"];
    statusIndex = 0;
    const status = await pollEthTransactionStatus("0xrecover", { intervalMs: 0, attempts: 5 });
    expect(status).toBe("success");
    expect(getEthTxStatus).toHaveBeenCalledTimes(2);
  });

  it("fails fast on a non-retryable EarnApiError (4xx) instead of exhausting all attempts", async () => {
    statusSteps = [{ throwApiError: true }, "success"];
    statusIndex = 0;
    await expect(
      pollEthTransactionStatus("0xbad", { intervalMs: 0, attempts: 5 }),
    ).rejects.toBeInstanceOf(EarnApiError);
    expect(getEthTxStatus).toHaveBeenCalledTimes(1);
  });

  it("returns the last non-terminal status once attempts are exhausted", async () => {
    statusSteps = ["pending_confirmation"];
    statusIndex = 0;
    const status = await pollEthTransactionStatus("0xtimeout", { intervalMs: 0, attempts: 3 });
    expect(status).toBe("pending_confirmation");
    expect(getEthTxStatus).toHaveBeenCalledTimes(3);
  });
});

afterEach(() => {
  statusSteps = ["success"];
  statusIndex = 0;
});
