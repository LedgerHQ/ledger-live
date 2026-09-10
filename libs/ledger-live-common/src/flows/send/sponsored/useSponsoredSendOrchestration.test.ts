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

test("submit failure sets phase FAILED / failureKind RENT_PAYMENT", async () => {
  const seam = makeSeam({
    submitEnergyRentPayment: jest.fn().mockRejectedValue(new Error("submit boom")),
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

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
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
