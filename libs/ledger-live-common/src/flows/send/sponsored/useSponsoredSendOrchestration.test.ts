/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { getSponsoredCoinApi } from "../../../bridge/generic-coin-framework/sponsored";
import type { EnergyRentRequest } from "../../../bridge/generic-coin-framework/sponsored";
import { SPONSORED_FAILURE_KIND, SPONSORED_PHASE } from "./types";
import { useSponsoredSendOrchestration } from "./useSponsoredSendOrchestration";

jest.mock("../../../bridge/generic-coin-framework/sponsored", () => ({
  getSponsoredCoinApi: jest.fn(),
}));

const mockGetSponsoredCoinApi = jest.mocked(getSponsoredCoinApi);

const rentRequest: EnergyRentRequest = {
  payerAddress: "TPayer",
  receiverAddress: "TReceiver",
  energy: 1_000n,
  durationSeconds: 3_600,
};

const makeSeam = (overrides: Record<string, unknown> = {}) => ({
  listFeeOptions: jest.fn(),
  estimateSponsoredFeeQuote: jest.fn(),
  buildEnergyRentRequest: jest.fn().mockResolvedValue(rentRequest),
  craftEnergyRentTransaction: jest.fn().mockResolvedValue({
    orderId: "o1",
    transaction: {},
    payCoinCode: "USDT",
    payCoinAmt: "5.0",
  }),
  submitEnergyRentPayment: jest.fn().mockResolvedValue(undefined),
  awaitEnergyDelivery: jest.fn().mockResolvedValue(undefined),
  getEnergyRentStatus: jest.fn(),
  ...overrides,
});

const sendIntent = { type: "send", asset: { type: "trc20" }, recipient: "TReceiver" };

const defaultParams = {
  network: "tron",
  kind: "local",
  intent: sendIntent,
};

beforeEach(() => {
  jest.clearAllMocks();
});

test("craft failure sets phase FAILED / failureKind RENT_PAYMENT", async () => {
  const seam = makeSeam({
    craftEnergyRentTransaction: jest.fn().mockRejectedValue(new Error("craft boom")),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
});

test("a crafted order without a signable transaction fails as RENT_PAYMENT, not CRAFT_SUCCESS", async () => {
  const seam = makeSeam({
    craftEnergyRentTransaction: jest.fn().mockResolvedValue({
      orderId: "o1",
      transaction: null,
      payCoinCode: "USDT",
      payCoinAmt: "5.0",
    }),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
  expect(result.current.state.order).toBeNull();
});

test("buildEnergyRentRequest failure sets phase FAILED / failureKind RENT_PAYMENT", async () => {
  const seam = makeSeam({
    buildEnergyRentRequest: jest.fn().mockRejectedValue(new Error("energy sim boom")),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });

  expect(seam.craftEnergyRentTransaction).not.toHaveBeenCalled();
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
});

test("submit failure the provider confirms unpaid -> RENT_PAYMENT (safe to re-craft)", async () => {
  const seam = makeSeam({
    submitEnergyRentPayment: jest.fn().mockRejectedValue(new Error("submit boom")),
    // Reconciliation after the ambiguous submit error confirms the order never got paid.
    getEnergyRentStatus: jest.fn().mockResolvedValue("failed"),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);

  await act(async () => {
    await result.current.actions.startRentPayment({});
  });

  expect(seam.getEnergyRentStatus).toHaveBeenCalledWith({ orderId: "o1", payerAddress: "TPayer" });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
});

test("reset while seam resolution is pending skips the irreversible payment submit", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);

  // reset() runs synchronously after startRentPayment has entered `await getSeam()`, bumping the
  // generation before the post-await guard. The device already signed TX-A, but the flow was
  // abandoned, so the stale payment must never reach submitEnergyRentPayment.
  await act(async () => {
    const pending = result.current.actions.startRentPayment({}, "tx-A-hash");
    result.current.actions.reset();
    await pending;
  });

  expect(seam.submitEnergyRentPayment).not.toHaveBeenCalled();
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.IDLE);
});

test.each([["paid"], ["pending"], ["unknown"]])(
  "submit failure the provider reports as %s -> DELIVERY_FAILED (never re-craft as unpaid)",
  async status => {
    const seam = makeSeam({
      submitEnergyRentPayment: jest.fn().mockRejectedValue(new Error("submit boom")),
      getEnergyRentStatus: jest.fn().mockResolvedValue(status),
    });
    mockGetSponsoredCoinApi.mockResolvedValue(seam);

    const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

    await act(async () => {
      await result.current.actions.craftRent();
    });
    await act(async () => {
      await result.current.actions.startRentPayment({});
    });

    expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
    expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
  },
);

test("submit failure but the provider reports delivered -> proceeds to TRANSFER (energy already available)", async () => {
  const seam = makeSeam({
    submitEnergyRentPayment: jest.fn().mockRejectedValue(new Error("submit boom")),
    // The broadcast rejected but reconciliation shows the energy already delivered.
    getEnergyRentStatus: jest.fn().mockResolvedValue("delivered"),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment({});
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
});

test("submit-path DELIVERY_FAILED carries the caller's paymentTxId for the support screen", async () => {
  const seam = makeSeam({
    submitEnergyRentPayment: jest.fn().mockRejectedValue(new Error("submit boom")),
    getEnergyRentStatus: jest.fn().mockResolvedValue("paid"),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment({}, "tx-A-hash");
  });

  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
  expect(result.current.state.paymentTxId).toBe("tx-A-hash");
});

test("submit failure whose reconciliation also fails -> DELIVERY_FAILED (avoid double charge)", async () => {
  const seam = makeSeam({
    submitEnergyRentPayment: jest.fn().mockRejectedValue(new Error("submit boom")),
    getEnergyRentStatus: jest.fn().mockRejectedValue(new Error("status boom")),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment({});
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
});

test("delivery timeout the provider then reports delivered -> proceeds to TRANSFER (salvaged)", async () => {
  const timeoutError = Object.assign(new Error("timed out"), {
    name: "EnergyDelegationTimeoutError",
    paymentTxId: "tx-late",
  });
  const seam = makeSeam({
    awaitEnergyDelivery: jest.fn().mockRejectedValue(timeoutError),
    // The rented energy landed just after our client deadline.
    getEnergyRentStatus: jest.fn().mockResolvedValue("delivered"),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment({});
  });

  expect(seam.getEnergyRentStatus).toHaveBeenCalledWith({ orderId: "o1", payerAddress: "TPayer" });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
});

test("happy path: craft -> RENT_SIGNING, startRentPayment -> TRANSFER", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);
  expect(result.current.state.order).toEqual({
    orderId: "o1",
    transaction: {},
    payCoinCode: "USDT",
    payCoinAmt: "5.0",
  });

  await act(async () => {
    await result.current.actions.startRentPayment({ signed: true });
  });

  expect(seam.submitEnergyRentPayment).toHaveBeenCalledWith({
    orderId: "o1",
    signedTransaction: { signed: true },
  });
  expect(seam.awaitEnergyDelivery).toHaveBeenCalledWith(
    { orderId: "o1", payerAddress: "TPayer" },
    expect.objectContaining({ paymentTxId: undefined }),
  );
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
});

test("awaitEnergyDelivery timeout -> FAILED / DELIVERY_FAILED, carries paymentTxId", async () => {
  const timeoutError = Object.assign(new Error("timed out"), {
    name: "EnergyDelegationTimeoutError",
    paymentTxId: "tx-123",
  });
  const seam = makeSeam({
    awaitEnergyDelivery: jest.fn().mockRejectedValue(timeoutError),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment({});
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
  expect(result.current.state.paymentTxId).toBe("tx-123");
});

test("awaitEnergyDelivery generic order failure -> FAILED / DELIVERY_FAILED (payment already sent)", async () => {
  const apiError = Object.assign(new Error("order failed"), { name: "TronifyApiError" });
  const seam = makeSeam({
    awaitEnergyDelivery: jest.fn().mockRejectedValue(apiError),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment({});
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  // TX A succeeded before delivery failed, so this shares the delivery-not-received kind (funds
  // moved, contact support) — not RENT_PAYMENT, whose "funds were not moved" copy would be wrong.
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
});

test("onTransferError sets phase FAILED / failureKind TRANSFER", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment({});
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);

  act(() => {
    result.current.actions.onTransferError(new Error("transfer boom"));
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.TRANSFER);
});

test("retry from DELIVERY_FAILED -> RENT_SIGNING; retry from TRANSFER -> TRANSFER (order retained)", async () => {
  const timeoutError = Object.assign(new Error("timed out"), {
    name: "EnergyDelegationTimeoutError",
  });
  const seamTimeout = makeSeam({
    awaitEnergyDelivery: jest.fn().mockRejectedValue(timeoutError),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seamTimeout);

  const timeoutHook = renderHook(() => useSponsoredSendOrchestration(defaultParams));
  await act(async () => {
    await timeoutHook.result.current.actions.craftRent();
  });
  await act(async () => {
    await timeoutHook.result.current.actions.startRentPayment({});
  });
  expect(timeoutHook.result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);

  act(() => {
    timeoutHook.result.current.actions.retry();
  });
  expect(timeoutHook.result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);
  expect(timeoutHook.result.current.state.order).toBeNull();

  // --- separate hook instance for the TRANSFER-failure retry ---
  const seamTransfer = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seamTransfer);

  const transferHook = renderHook(() => useSponsoredSendOrchestration(defaultParams));
  await act(async () => {
    await transferHook.result.current.actions.craftRent();
  });
  await act(async () => {
    await transferHook.result.current.actions.startRentPayment({});
  });
  expect(transferHook.result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);

  act(() => {
    transferHook.result.current.actions.onTransferError(new Error("transfer boom"));
  });
  expect(transferHook.result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.TRANSFER);

  act(() => {
    transferHook.result.current.actions.retry();
  });
  expect(transferHook.result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
  expect(transferHook.result.current.state.order).not.toBeNull();
});

test("contract-data refusal resumes at the phase it failed on, keeping the paid order", async () => {
  // Refused while signing the rent tx (RENT_SIGNING): the reducer records that phase, so retry
  // resumes there — and the order is untouched (a device refusal moved no funds), so the screen
  // re-signs the same order rather than re-crafting.
  const rentSeam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(rentSeam);

  const rentHook = renderHook(() => useSponsoredSendOrchestration(defaultParams));
  await act(async () => {
    await rentHook.result.current.actions.craftRent();
  });
  expect(rentHook.result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);

  act(() => {
    rentHook.result.current.actions.setContractDataFailure(new Error("0x6a80"));
  });
  expect(rentHook.result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.CONTRACT_DATA);

  act(() => {
    rentHook.result.current.actions.retry();
  });
  expect(rentHook.result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);
  expect(rentHook.result.current.state.order).not.toBeNull();

  // Refused while signing the transfer (TRANSFER): the delegation already succeeded, so retry
  // resumes at TRANSFER on the same rental.
  const transferSeam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(transferSeam);

  const transferHook = renderHook(() => useSponsoredSendOrchestration(defaultParams));
  await act(async () => {
    await transferHook.result.current.actions.craftRent();
  });
  await act(async () => {
    await transferHook.result.current.actions.startRentPayment({});
  });
  expect(transferHook.result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);

  act(() => {
    transferHook.result.current.actions.setContractDataFailure(new Error("0x6a80"));
  });
  expect(transferHook.result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.CONTRACT_DATA);

  act(() => {
    transferHook.result.current.actions.retry();
  });
  expect(transferHook.result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
  expect(transferHook.result.current.state.order).not.toBeNull();
});

test("onTransferSuccess sets phase DONE", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment({});
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);

  act(() => {
    result.current.actions.onTransferSuccess();
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.DONE);
  expect(result.current.state.failureKind).toBeNull();
});

test("startRentPayment threads the caller's paymentTxId into awaitEnergyDelivery and onto a timeout", async () => {
  const timeoutError = Object.assign(new Error("timed out"), {
    name: "EnergyDelegationTimeoutError",
    paymentTxId: "real-tx-A",
  });
  const seam = makeSeam({
    awaitEnergyDelivery: jest.fn().mockRejectedValue(timeoutError),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment({}, "real-tx-A");
  });

  expect(result.current.state.paymentTxId).toBe("real-tx-A");
  expect(seam.awaitEnergyDelivery).toHaveBeenCalledWith(
    { orderId: "o1", payerAddress: "TPayer" },
    expect.objectContaining({ paymentTxId: "real-tx-A" }),
  );
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
});

test("a retried craft clears the prior cycle's paymentTxId", async () => {
  const timeoutError = Object.assign(new Error("timed out"), {
    name: "EnergyDelegationTimeoutError",
    paymentTxId: "stale-tx",
  });
  const seam = makeSeam({
    awaitEnergyDelivery: jest.fn().mockRejectedValue(timeoutError),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment({}, "stale-tx");
  });
  expect(result.current.state.paymentTxId).toBe("stale-tx");

  act(() => {
    result.current.actions.retry();
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);
  expect(result.current.state.paymentTxId).toBeNull();

  // A fresh craft after retry must not carry the stale id forward.
  await act(async () => {
    await result.current.actions.craftRent();
  });
  expect(result.current.state.paymentTxId).toBeNull();
});

test("a getSeam rejection in craftRent lands in FAILED / RENT_PAYMENT, not an unhandled rejection", async () => {
  // getSponsoredCoinApi itself rejecting (vs. resolving null) must be caught, not escape the awaited
  // getSeam() — craftRent resolves the seam first, so this is the reachable seam-reject site.
  mockGetSponsoredCoinApi.mockRejectedValue(new Error("resolver down"));

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
});

// Staying IDLE would strand the rent-signature screen with no cancel and no back.
test("seam null -> craftRent fails the flow instead of silently no-op'ing", async () => {
  mockGetSponsoredCoinApi.mockResolvedValue(null);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
  expect(result.current.state.order).toBeNull();
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// The context calls reset() whenever the send identity (recipient/amount/…) changes. An async craft
// or delivery that started for the previous identity must not commit its result into the fresh state.
test("a craft that resolves after reset() is dropped, not committed as a stale order", async () => {
  const craftGate = deferred<void>();
  const craftCalled = deferred<void>();
  const seam = makeSeam({
    craftEnergyRentTransaction: jest.fn().mockImplementation(() => {
      craftCalled.resolve();
      return craftGate.promise.then(() => ({
        orderId: "stale",
        transaction: {},
        payCoinCode: "USDT",
        payCoinAmt: "5.0",
      }));
    }),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  let craftPromise!: Promise<void>;
  await act(async () => {
    craftPromise = result.current.actions.craftRent();
    // Park past getSeam + buildEnergyRentRequest, at the pending craftEnergyRentTransaction.
    await craftCalled.promise;
  });

  // Send identity changed mid-craft.
  act(() => {
    result.current.actions.reset();
  });

  await act(async () => {
    craftGate.resolve();
    await craftPromise;
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.IDLE);
  expect(result.current.state.order).toBeNull();
});

test("a delivery that resolves after reset() is dropped, not committed as DELIVERY_SUCCESS", async () => {
  const deliverGate = deferred<void>();
  const deliverCalled = deferred<void>();
  const seam = makeSeam({
    awaitEnergyDelivery: jest.fn().mockImplementation(() => {
      deliverCalled.resolve();
      return deliverGate.promise;
    }),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);

  let payPromise!: Promise<void>;
  await act(async () => {
    payPromise = result.current.actions.startRentPayment({}, "txA");
    await deliverCalled.promise;
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.POLLING);

  act(() => {
    result.current.actions.reset();
  });

  await act(async () => {
    deliverGate.resolve();
    await payPromise;
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.IDLE);
});
