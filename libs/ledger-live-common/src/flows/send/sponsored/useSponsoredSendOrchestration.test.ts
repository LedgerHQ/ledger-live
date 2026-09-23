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
    payCoinCode: "TRX",
    payCoinAmt: "5.0",
  }),
  submitEnergyRentPayment: jest.fn().mockResolvedValue(undefined),
  awaitEnergyDelivery: jest.fn().mockResolvedValue(undefined),
  getEnergyRentStatus: jest.fn(),
  isEnergyDelivered: jest.fn().mockResolvedValue(false),
  getEnergyRentSignaturePayload: jest
    .fn()
    .mockReturnValue({ toSign: "0adeadbeef", paymentTxId: "txA" }),
  buildSignedEnergyRentTransaction: jest.fn().mockReturnValue({ signed: true }),
  nativeRentAmount: jest.fn().mockReturnValue(5_000_000n),
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
      payCoinCode: "TRX",
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
    await result.current.actions.startRentPayment("sig");
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
    const pending = result.current.actions.startRentPayment("sig");
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

  // unmount() runs the hook's cleanup, bumping the generation, after startRentPayment has entered
  // `await getSeam()` but before its post-await guard.
  await act(async () => {
    const pending = result.current.actions.startRentPayment("sig");
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
    // Simulate an in-flight poll: capture the abort signal and never resolve, so only the unmount can
    // end it.
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
    void result.current.actions.startRentPayment("sig");
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
      await result.current.actions.startRentPayment("sig");
    });

    expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
    expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
  },
);

test("submit failure the provider reports delivered AND the chain confirms -> proceeds to TRANSFER", async () => {
  const seam = makeSeam({
    submitEnergyRentPayment: jest.fn().mockRejectedValue(new Error("submit boom")),
    // The broadcast rejected but the provider reports delivered — released only once the on-chain
    // read corroborates it (AC2): advisory status alone never reaches TRANSFER.
    getEnergyRentStatus: jest.fn().mockResolvedValue("delivered"),
    isEnergyDelivered: jest.fn().mockResolvedValue(true),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig");
  });

  expect(seam.isEnergyDelivered).toHaveBeenCalledWith({
    receiverAddress: "TReceiver",
    energyNeeded: 1_000n,
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
  // This path skips POLLING_START, so the payment id must ride DELIVERY_SUCCESS onto state — the
  // native-TRX rent reservation keys off it and would otherwise never lock this paid rental.
  expect(result.current.state.paymentTxId).toBe("txA");
});

test("submit failure the provider reports delivered but the chain does NOT confirm -> DELIVERY_FAILED, not TRANSFER", async () => {
  const seam = makeSeam({
    submitEnergyRentPayment: jest.fn().mockRejectedValue(new Error("submit boom")),
    // The provider's advisory "delivered" must never release TX-C without an on-chain confirmation.
    getEnergyRentStatus: jest.fn().mockResolvedValue("delivered"),
    isEnergyDelivered: jest.fn().mockResolvedValue(false),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig");
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
  expect(result.current.state.paymentTxId).toBe("txA");
});

test("submit failure, provider still reports paid but the chain confirms -> proceeds to TRANSFER", async () => {
  const seam = makeSeam({
    submitEnergyRentPayment: jest.fn().mockRejectedValue(new Error("submit boom")),
    // The provider's order list lags (pages only recent orders), so it can report paid after the
    // delegation landed: the authoritative on-chain read must still release TX-C, not route to support.
    getEnergyRentStatus: jest.fn().mockResolvedValue("paid"),
    isEnergyDelivered: jest.fn().mockResolvedValue(true),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig");
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
    await result.current.actions.startRentPayment("sig");
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
    await result.current.actions.startRentPayment("sig");
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
    // The rented energy landed just after our client deadline — salvaged by a final on-chain read,
    // never by the provider's advisory status (AC2).
    isEnergyDelivered: jest.fn().mockResolvedValue(true),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig");
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
    // Provider would say delivered, but only the on-chain read gates TX-C — and it is still unmet.
    getEnergyRentStatus: jest.fn().mockResolvedValue("delivered"),
    isEnergyDelivered: jest.fn().mockResolvedValue(false),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent();
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig");
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
    payCoinCode: "TRX",
    payCoinAmt: "5.0",
  });

  await act(async () => {
    await result.current.actions.startRentPayment("sig");
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
    await result.current.actions.startRentPayment("sig");
  });

  // The flow has advanced to TRANSFER with the order still on state. The in-flight guard has cleared,
  // so a duplicate/stale signature callback would submit the same rent again — the phase guard blocks
  // the re-submit (double-charge protection).
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
  expect(seam.submitEnergyRentPayment).toHaveBeenCalledTimes(1);

  await act(async () => {
    await result.current.actions.startRentPayment("sig");
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

  // Capture the callback instance from the RENT_SIGNING render, as a device-signing effect that
  // subscribed once would hold it. Its first call advances the flow to TRANSFER; re-firing the SAME
  // stale closure (a duplicate signature emission) must still be blocked, because the guard reads the
  // live phase through stateRef rather than the RENT_SIGNING snapshot this closure captured.
  const staleStart = result.current.actions.startRentPayment;
  await act(async () => {
    await staleStart("sig");
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
  expect(seam.submitEnergyRentPayment).toHaveBeenCalledTimes(1);

  await act(async () => {
    await staleStart("sig");
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
    await result.current.actions.startRentPayment("sig");
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
    await result.current.actions.startRentPayment("sig");
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
    await result.current.actions.startRentPayment("sig");
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
    await timeoutHook.result.current.actions.startRentPayment("sig");
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
    await transferHook.result.current.actions.startRentPayment("sig");
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
    await transferHook.result.current.actions.startRentPayment("sig");
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
    await result.current.actions.startRentPayment("sig");
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);

  act(() => {
    result.current.actions.onTransferSuccess();
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.DONE);
  expect(result.current.state.failureKind).toBeNull();
});

test("a stale transfer callback outside the TRANSFER phase is ignored (does not complete a reused flow)", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  // The flow is at RENT_SIGNING (e.g. a reset-and-reused send). A delayed TX-C callback from the prior
  // flow must not drive this one to DONE/FAILED — the transfer reducer cases are gated on TRANSFER.
  await act(async () => {
    await result.current.actions.craftRent();
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);

  act(() => {
    result.current.actions.onTransferSuccess();
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);

  act(() => {
    result.current.actions.onTransferError(new Error("stale tx-C failure"));
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
    await result.current.actions.startRentPayment("sig");
  });
  act(() => {
    result.current.actions.onTransferSuccess();
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.DONE);

  // A delayed contract-data refusal from a prior signing step must not drag DONE back to FAILED — it
  // is only valid while signing (RENT_SIGNING/TRANSFER).
  act(() => {
    result.current.actions.setContractDataFailure(new Error("0x6a80"));
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.DONE);
  expect(result.current.state.failureKind).toBeNull();

  // Same at IDLE (a fresh reused flow before crafting): the refusal must not move it to FAILED.
  act(() => {
    result.current.actions.reset();
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.IDLE);
  act(() => {
    result.current.actions.setContractDataFailure(new Error("0x6a80"));
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.IDLE);
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
    await result.current.actions.startRentPayment("sig");
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
    await result.current.actions.startRentPayment("sig");
  });
  expect(result.current.state.paymentTxId).toBe("stale-tx");

  act(() => {
    result.current.actions.retry();
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);
  expect(result.current.state.paymentTxId).toBeNull();

  // A fresh craft after retry carries its own id, not the prior cycle's stale one.
  await act(async () => {
    await result.current.actions.craftRent();
  });
  expect(result.current.state.paymentTxId).toBe("txA");
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
        payCoinCode: "TRX",
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
    payPromise = result.current.actions.startRentPayment("sig");
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
  reservedNativeAmount: 5_000_000n,
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
    await result.current.actions.startRentPayment("sig");
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
      await result.current.actions.startRentPayment("sig");
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
    await result.current.actions.startRentPayment("sig");
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
    await result.current.actions.startRentPayment("sig");
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
    payPromise = result.current.actions.startRentPayment("sig");
    await submitCalled.promise;
  });

  // The dialog closes / send identity changes while the irreversible submit is in flight.
  act(() => {
    result.current.actions.reset();
  });

  await act(async () => {
    submitGate.resolve();
    await payPromise;
  });

  // The flow reset to IDLE, but TX-A was charged — the reservation must still fire off the pre-reset
  // payer captured by the in-flight action.
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.IDLE);
  expect(onRentPaymentBroadcast).toHaveBeenCalledWith(broadcastInfo);
});
