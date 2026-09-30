/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { getSponsoredCoinApi } from "../../../bridge/generic-coin-framework/sponsored";
import type {
  EnergyRentRequest,
  RentPayment,
} from "../../../bridge/generic-coin-framework/sponsored";
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

const USDT_ASSET = {
  type: "trc20",
  assetReference: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  name: "Tether USD",
  unit: { name: "USDT", code: "USDT", magnitude: 6 },
};
const RENT_PAYMENT: RentPayment = { asset: USDT_ASSET, amount: 3_200_000n };

const makeSeam = (overrides: Record<string, unknown> = {}) => ({
  feeOptionId: "sponsored-fixture",
  providerName: "Provider",
  waivesErrorKeys: [],
  waivesWarningKeys: [],
  reservationDedupKey: jest.fn().mockReturnValue("1.5"),
  listFeeOptions: jest.fn(),
  estimateSponsoredFeeQuote: jest.fn(),
  buildEnergyRentRequest: jest.fn().mockResolvedValue(rentRequest),
  craftEnergyRentTransaction: jest.fn().mockResolvedValue({
    orderId: "o1",
    transaction: {},
    payCoinCode: "USDT",
    payCoinAmt: "3.2",
  }),
  submitEnergyRentPayment: jest.fn().mockResolvedValue(undefined),
  awaitEnergyDelivery: jest.fn().mockResolvedValue(undefined),
  getEnergyRentStatus: jest.fn(),
  isEnergyDelivered: jest.fn().mockResolvedValue(false),
  getEnergyRentSignaturePayload: jest
    .fn()
    .mockReturnValue({ toSign: "0adeadbeef", paymentTxId: "txA" }),
  buildSignedEnergyRentTransaction: jest.fn().mockReturnValue({ signed: true }),
  rentPayment: jest.fn().mockReturnValue(RENT_PAYMENT),
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
      payCoinAmt: "3.2",
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

test("a rentPayment that throws fails the craft as RENT_PAYMENT and keeps the order out of state", async () => {
  const seam = makeSeam({
    rentPayment: jest.fn(() => {
      throw new Error("Cannot reserve an energy-rent payment of 3.2 TRX");
    }),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });

  expect(seam.rentPayment).toHaveBeenCalledTimes(1);
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
  expect(result.current.state.order).toBeNull();
  expect(result.current.state.rentPayment).toBeNull();
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
    getEnergyRentStatus: jest.fn().mockResolvedValue("failed"),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);

  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
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

  await act(async () => {
    const pending = result.current.actions.startRentPayment("sig", "txA");
    result.current.actions.reset();
    await pending;
  });

  expect(seam.submitEnergyRentPayment).not.toHaveBeenCalled();
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.IDLE);
});

test("closing the dialog (unmount) while seam resolution is pending skips the payment submit", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result, unmount } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);

  await act(async () => {
    const pending = result.current.actions.startRentPayment("sig", "txA");
    unmount();
    await pending;
  });

  expect(seam.submitEnergyRentPayment).not.toHaveBeenCalled();
});

test("closing the dialog (unmount) during polling aborts the delivery poll", async () => {
  let capturedSignal: AbortSignal | undefined;
  let pollStarted!: () => void;
  const started = new Promise<void>(resolve => {
    pollStarted = resolve;
  });
  const seam = makeSeam({
    awaitEnergyDelivery: jest.fn((_ref, _target, opts) => {
      capturedSignal = opts?.signal;
      pollStarted();
      return new Promise<void>(() => {});
    }),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result, unmount } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });

  await act(async () => {
    void result.current.actions.startRentPayment("sig", "txA");
    await started;
  });

  expect(seam.awaitEnergyDelivery).toHaveBeenCalled();
  expect(capturedSignal?.aborted).toBe(false);

  unmount();

  expect(capturedSignal?.aborted).toBe(true);
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
      await result.current.actions.startRentPayment("sig", "txA");
    });

    expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
    expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
  },
);

test("submit failure the provider reports delivered AND the chain confirms -> proceeds to TRANSFER", async () => {
  const seam = makeSeam({
    submitEnergyRentPayment: jest.fn().mockRejectedValue(new Error("submit boom")),
    getEnergyRentStatus: jest.fn().mockResolvedValue("delivered"),
    isEnergyDelivered: jest.fn().mockResolvedValue(true),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(seam.isEnergyDelivered).toHaveBeenCalledWith({
    receiverAddress: "TReceiver",
    energyNeeded: 1_000n,
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
  expect(result.current.state.paymentTxId).toBe("txA");
});

test("submit failure the provider reports delivered but the chain does NOT confirm -> DELIVERY_FAILED, not TRANSFER", async () => {
  const seam = makeSeam({
    submitEnergyRentPayment: jest.fn().mockRejectedValue(new Error("submit boom")),
    getEnergyRentStatus: jest.fn().mockResolvedValue("delivered"),
    isEnergyDelivered: jest.fn().mockResolvedValue(false),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
  expect(result.current.state.paymentTxId).toBe("txA");
});

test("submit failure, provider still reports paid but the chain confirms -> proceeds to TRANSFER", async () => {
  const seam = makeSeam({
    submitEnergyRentPayment: jest.fn().mockRejectedValue(new Error("submit boom")),
    getEnergyRentStatus: jest.fn().mockResolvedValue("paid"),
    isEnergyDelivered: jest.fn().mockResolvedValue(true),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(seam.isEnergyDelivered).toHaveBeenCalledWith({
    receiverAddress: "TReceiver",
    energyNeeded: 1_000n,
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
  expect(result.current.state.paymentTxId).toBe("txA");
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
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
  expect(result.current.state.paymentTxId).toBe("txA");
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
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
});

test("delivery timeout the chain then confirms delivered -> proceeds to TRANSFER (salvaged on-chain)", async () => {
  const timeoutError = Object.assign(new Error("timed out"), {
    name: "EnergyDelegationTimeoutError",
    paymentTxId: "tx-late",
  });
  const seam = makeSeam({
    awaitEnergyDelivery: jest.fn().mockRejectedValue(timeoutError),
    isEnergyDelivered: jest.fn().mockResolvedValue(true),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(seam.isEnergyDelivered).toHaveBeenCalledWith({
    receiverAddress: "TReceiver",
    energyNeeded: 1_000n,
  });
  expect(seam.getEnergyRentStatus).not.toHaveBeenCalled();
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
});

test("delivery timeout the chain does NOT confirm -> DELIVERY_FAILED (provider status can't salvage)", async () => {
  const timeoutError = Object.assign(new Error("timed out"), {
    name: "EnergyDelegationTimeoutError",
    paymentTxId: "tx-late",
  });
  const seam = makeSeam({
    awaitEnergyDelivery: jest.fn().mockRejectedValue(timeoutError),
    getEnergyRentStatus: jest.fn().mockResolvedValue("delivered"),
    isEnergyDelivered: jest.fn().mockResolvedValue(false),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
  expect(result.current.state.paymentTxId).toBe("tx-late");
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
    payCoinAmt: "3.2",
  });
  expect(result.current.state.rentPayment).toEqual(RENT_PAYMENT);
  expect(seam.rentPayment).toHaveBeenCalledWith(result.current.state.order);

  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(seam.submitEnergyRentPayment).toHaveBeenCalledWith({
    orderId: "o1",
    signedTransaction: { signed: true },
  });
  expect(seam.awaitEnergyDelivery).toHaveBeenCalledWith(
    { orderId: "o1", payerAddress: "TPayer" },
    { receiverAddress: "TReceiver", energyNeeded: 1_000n },
    expect.objectContaining({ paymentTxId: "txA" }),
  );
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
});

test("a stale signature callback after the flow advanced past RENT_SIGNING does not re-broadcast TX-A", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
  expect(seam.submitEnergyRentPayment).toHaveBeenCalledTimes(1);

  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(seam.submitEnergyRentPayment).toHaveBeenCalledTimes(1);
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
});

test("a RETAINED startRentPayment closure re-fired after the flow advanced does not re-broadcast TX-A", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);

  const staleStart = result.current.actions.startRentPayment;
  await act(async () => {
    await staleStart("sig", "txA");
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
  expect(seam.submitEnergyRentPayment).toHaveBeenCalledTimes(1);

  await act(async () => {
    await staleStart("sig", "txA");
  });
  expect(seam.submitEnergyRentPayment).toHaveBeenCalledTimes(1);
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
});

test("a signature for a reset-and-recrafted cycle's prior order is dropped, not signed against the new order", async () => {
  const seam = makeSeam({
    getEnergyRentSignaturePayload: jest
      .fn()
      .mockReturnValueOnce({ toSign: "0aA", paymentTxId: "txA" })
      .mockReturnValueOnce({ toSign: "0aB", paymentTxId: "txB" }),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  expect(result.current.state.paymentTxId).toBe("txA");

  act(() => {
    result.current.actions.reset();
  });
  await act(async () => {
    await result.current.actions.craftRent();
  });
  expect(result.current.state.paymentTxId).toBe("txB");

  await act(async () => {
    await result.current.actions.startRentPayment("staleSigA", "txA");
  });
  expect(seam.submitEnergyRentPayment).not.toHaveBeenCalled();
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);

  await act(async () => {
    await result.current.actions.startRentPayment("sigB", "txB");
  });
  expect(seam.submitEnergyRentPayment).toHaveBeenCalledTimes(1);
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
    await result.current.actions.startRentPayment("sig", "txA");
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
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
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
    await result.current.actions.startRentPayment("sig", "txA");
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);

  act(() => {
    result.current.actions.onTransferError(new Error("transfer boom"), "txA");
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
    await timeoutHook.result.current.actions.startRentPayment("sig", "txA");
  });
  expect(timeoutHook.result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);

  act(() => {
    timeoutHook.result.current.actions.retry();
  });
  expect(timeoutHook.result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);
  expect(timeoutHook.result.current.state.order).toBeNull();
  expect(timeoutHook.result.current.state.rentPayment).toBeNull();

  // --- separate hook instance for the TRANSFER-failure retry ---
  const seamTransfer = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seamTransfer);

  const transferHook = renderHook(() => useSponsoredSendOrchestration(defaultParams));
  await act(async () => {
    await transferHook.result.current.actions.craftRent();
  });
  await act(async () => {
    await transferHook.result.current.actions.startRentPayment("sig", "txA");
  });
  expect(transferHook.result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);

  act(() => {
    transferHook.result.current.actions.onTransferError(new Error("transfer boom"), "txA");
  });
  expect(transferHook.result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.TRANSFER);

  act(() => {
    transferHook.result.current.actions.retry();
  });
  expect(transferHook.result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
  expect(transferHook.result.current.state.order).not.toBeNull();
  expect(transferHook.result.current.state.rentPayment).toEqual(RENT_PAYMENT);
});

test("contract-data refusal resumes at the phase it failed on, keeping the paid order", async () => {
  const rentSeam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(rentSeam);

  const rentHook = renderHook(() => useSponsoredSendOrchestration(defaultParams));
  await act(async () => {
    await rentHook.result.current.actions.craftRent();
  });
  expect(rentHook.result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);

  act(() => {
    rentHook.result.current.actions.setContractDataFailure(new Error("0x6a80"), "txA");
  });
  expect(rentHook.result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.CONTRACT_DATA);

  act(() => {
    rentHook.result.current.actions.retry();
  });
  expect(rentHook.result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);
  expect(rentHook.result.current.state.order).not.toBeNull();

  const transferSeam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(transferSeam);

  const transferHook = renderHook(() => useSponsoredSendOrchestration(defaultParams));
  await act(async () => {
    await transferHook.result.current.actions.craftRent();
  });
  await act(async () => {
    await transferHook.result.current.actions.startRentPayment("sig", "txA");
  });
  expect(transferHook.result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);

  act(() => {
    transferHook.result.current.actions.setContractDataFailure(new Error("0x6a80"), "txA");
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
    await result.current.actions.startRentPayment("sig", "txA");
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);

  act(() => {
    result.current.actions.onTransferSuccess("txA");
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.DONE);
  expect(result.current.state.failureKind).toBeNull();
});

test("a stale transfer callback outside the TRANSFER phase is ignored (does not complete a reused flow)", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);

  act(() => {
    result.current.actions.onTransferSuccess("txA");
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);

  act(() => {
    result.current.actions.onTransferError(new Error("stale tx-C failure"), "txA");
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);
});

test("a stale contract-data refusal outside a signing phase is ignored (does not fail a done/idle flow)", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });
  act(() => {
    result.current.actions.onTransferSuccess("txA");
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.DONE);

  act(() => {
    result.current.actions.setContractDataFailure(new Error("0x6a80"), "txA");
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.DONE);
  expect(result.current.state.failureKind).toBeNull();

  act(() => {
    result.current.actions.reset();
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.IDLE);
  act(() => {
    result.current.actions.setContractDataFailure(new Error("0x6a80"), "txA");
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.IDLE);
});

test("a contract-data refusal for a reset-and-recrafted cycle's prior order is ignored, not applied to the new order", async () => {
  const seam = makeSeam({
    getEnergyRentSignaturePayload: jest
      .fn()
      .mockReturnValueOnce({ toSign: "0aA", paymentTxId: "txA" })
      .mockReturnValueOnce({ toSign: "0aB", paymentTxId: "txB" }),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  act(() => {
    result.current.actions.reset();
  });
  await act(async () => {
    await result.current.actions.craftRent();
  });
  expect(result.current.state.paymentTxId).toBe("txB");

  act(() => {
    result.current.actions.setContractDataFailure(new Error("0x6a80"), "txA");
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);
  expect(result.current.state.failureKind).toBeNull();

  act(() => {
    result.current.actions.setContractDataFailure(new Error("0x6a80"), "txB");
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.CONTRACT_DATA);
});

test("a transfer outcome for a reset cycle's prior order is ignored once a new cycle reaches TRANSFER", async () => {
  const seam = makeSeam({
    getEnergyRentSignaturePayload: jest
      .fn()
      .mockReturnValueOnce({ toSign: "0aA", paymentTxId: "txA" })
      .mockReturnValueOnce({ toSign: "0aB", paymentTxId: "txB" }),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  act(() => {
    result.current.actions.reset();
  });
  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sigB", "txB");
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);

  act(() => {
    result.current.actions.onTransferError(new Error("stale tx-C failure"), "txA");
  });
  act(() => {
    result.current.actions.onTransferSuccess("txA");
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
  expect(result.current.state.failureKind).toBeNull();

  act(() => {
    result.current.actions.onTransferSuccess("txB");
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.DONE);
});

test("a callback bound to no payment id (null) never matches the current cycle", async () => {
  mockGetSponsoredCoinApi.mockResolvedValue(makeSeam());

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);

  act(() => {
    result.current.actions.onTransferSuccess(null);
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
});

test("awaitEnergyDelivery gets the craft-derived paymentTxId; a timeout's own id lands on state", async () => {
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
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(result.current.state.paymentTxId).toBe("real-tx-A");
  expect(seam.awaitEnergyDelivery).toHaveBeenCalledWith(
    { orderId: "o1", payerAddress: "TPayer" },
    { receiverAddress: "TReceiver", energyNeeded: 1_000n },
    expect.objectContaining({ paymentTxId: "txA" }),
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
    await result.current.actions.startRentPayment("sig", "txA");
  });
  expect(result.current.state.paymentTxId).toBe("stale-tx");

  act(() => {
    result.current.actions.retry();
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);
  expect(result.current.state.paymentTxId).toBeNull();

  await act(async () => {
    await result.current.actions.craftRent();
  });
  expect(result.current.state.paymentTxId).toBe("txA");
});

test("a getSeam rejection in craftRent lands in FAILED / RENT_PAYMENT, not an unhandled rejection", async () => {
  mockGetSponsoredCoinApi.mockRejectedValue(new Error("resolver down"));

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
});

test("seam null -> craftRent fails the flow instead of silently no-op'ing", async () => {
  mockGetSponsoredCoinApi.mockResolvedValue(null);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
  expect(result.current.state.failureError?.name).toBe("SponsoredSendUnavailableError");
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
        payCoinAmt: "3.2",
      }));
    }),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  let craftPromise!: Promise<void>;
  await act(async () => {
    craftPromise = result.current.actions.craftRent();
    await craftCalled.promise;
  });

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

const order = (id: string) => ({
  orderId: `o${id}`,
  transaction: { id },
  payCoinCode: "USDT",
  payCoinAmt: "3.2",
});

test("overlapping craftRent calls: an older order resolving last doesn't replace the newer one", async () => {
  const olderGate = deferred<void>();
  const olderCalled = deferred<void>();
  const seam = makeSeam({
    craftEnergyRentTransaction: jest
      .fn()
      .mockImplementationOnce(() => {
        olderCalled.resolve();
        return olderGate.promise.then(() => order("A"));
      })
      .mockResolvedValueOnce(order("B")),
    getEnergyRentSignaturePayload: jest.fn((tx: { id: string }) => ({
      toSign: `0a${tx.id}`,
      paymentTxId: `tx${tx.id}`,
    })),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  let olderCraft!: Promise<void>;
  await act(async () => {
    olderCraft = result.current.actions.craftRent();
    await olderCalled.promise;
  });
  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    olderGate.resolve();
    await olderCraft;
  });

  expect(result.current.state.order?.orderId).toBe("oB");
  expect(result.current.state.paymentTxId).toBe("txB");
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
    payPromise = result.current.actions.startRentPayment("sig", "txA");
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

const broadcastInfo = {
  paymentTxId: "txA",
  payerAddress: "TPayer",
  rentPayment: RENT_PAYMENT,
};

test("onRentPaymentBroadcast fires on the happy submit path with the payer and amount", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);
  const onRentPaymentBroadcast = jest.fn();

  const { result } = renderHook(() =>
    useSponsoredSendOrchestration({ ...defaultParams, onRentPaymentBroadcast }),
  );

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(onRentPaymentBroadcast).toHaveBeenCalledTimes(1);
  expect(onRentPaymentBroadcast).toHaveBeenCalledWith(broadcastInfo);
});

test.each([["paid"], ["pending"], ["unknown"]])(
  "onRentPaymentBroadcast fires when a submit reject reconciles to DELIVERY_FAILED (%s)",
  async status => {
    const seam = makeSeam({
      submitEnergyRentPayment: jest.fn().mockRejectedValue(new Error("submit boom")),
      getEnergyRentStatus: jest.fn().mockResolvedValue(status),
    });
    mockGetSponsoredCoinApi.mockResolvedValue(seam);
    const onRentPaymentBroadcast = jest.fn();

    const { result } = renderHook(() =>
      useSponsoredSendOrchestration({ ...defaultParams, onRentPaymentBroadcast }),
    );
    await act(async () => {
      await result.current.actions.craftRent();
    });
    await act(async () => {
      await result.current.actions.startRentPayment("sig", "txA");
    });

    expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
    expect(onRentPaymentBroadcast).toHaveBeenCalledWith(broadcastInfo);
  },
);

test("onRentPaymentBroadcast fires when a submit reject reconciles to delivered", async () => {
  const seam = makeSeam({
    submitEnergyRentPayment: jest.fn().mockRejectedValue(new Error("submit boom")),
    getEnergyRentStatus: jest.fn().mockResolvedValue("delivered"),
    isEnergyDelivered: jest.fn().mockResolvedValue(true),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);
  const onRentPaymentBroadcast = jest.fn();

  const { result } = renderHook(() =>
    useSponsoredSendOrchestration({ ...defaultParams, onRentPaymentBroadcast }),
  );
  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
  expect(onRentPaymentBroadcast).toHaveBeenCalledWith(broadcastInfo);
});

test("onRentPaymentBroadcast does NOT fire when the provider confirms the payment never landed", async () => {
  const seam = makeSeam({
    submitEnergyRentPayment: jest.fn().mockRejectedValue(new Error("submit boom")),
    getEnergyRentStatus: jest.fn().mockResolvedValue("failed"),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);
  const onRentPaymentBroadcast = jest.fn();

  const { result } = renderHook(() =>
    useSponsoredSendOrchestration({ ...defaultParams, onRentPaymentBroadcast }),
  );
  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
  expect(onRentPaymentBroadcast).not.toHaveBeenCalled();
});

test("onRentPaymentBroadcast still fires when reset() abandons the flow mid-submit", async () => {
  const submitGate = deferred<void>();
  const submitCalled = deferred<void>();
  const seam = makeSeam({
    submitEnergyRentPayment: jest.fn().mockImplementation(() => {
      submitCalled.resolve();
      return submitGate.promise;
    }),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);
  const onRentPaymentBroadcast = jest.fn();

  const { result } = renderHook(() =>
    useSponsoredSendOrchestration({ ...defaultParams, onRentPaymentBroadcast }),
  );
  await act(async () => {
    await result.current.actions.craftRent();
  });

  let payPromise!: Promise<void>;
  await act(async () => {
    payPromise = result.current.actions.startRentPayment("sig", "txA");
    await submitCalled.promise;
  });

  act(() => {
    result.current.actions.reset();
  });

  await act(async () => {
    submitGate.resolve();
    await payPromise;
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.IDLE);
  expect(onRentPaymentBroadcast).toHaveBeenCalledWith(broadcastInfo);
});
