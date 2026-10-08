/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { log } from "@ledgerhq/logs";
import { getSponsoredCoinApi } from "../../../bridge/generic-coin-framework/sponsored";
import type {
  EnergyRentRequest,
  RentOrderRejection,
  RentPayment,
} from "../../../bridge/generic-coin-framework/sponsored";
import { SPONSORED_FAILURE_KIND, SPONSORED_PHASE } from "./types";
import { useSponsoredSendOrchestration } from "./useSponsoredSendOrchestration";

jest.mock("../../../bridge/generic-coin-framework/sponsored", () => ({
  getSponsoredCoinApi: jest.fn(),
}));
jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));

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
const REVIEW_FEE = 3_200_000n;

const PAYMENT_EXPIRES_AT = Date.now() + 6 * 60_000;
const PAYMENT_EXPIRY_MARGIN_MS = 30_000;
const RETRY_UNLOCKS_AT = PAYMENT_EXPIRES_AT + PAYMENT_EXPIRY_MARGIN_MS;

const rentOrder = (overrides: Record<string, unknown> = {}) => ({
  orderId: "o1",
  transaction: {},
  payCoinCode: "USDT",
  payCoinAmt: "3.2",
  paymentExpiresAt: PAYMENT_EXPIRES_AT,
  ...overrides,
});

const makeSeam = (overrides: Record<string, unknown> = {}) => ({
  feeOptionId: "sponsored-fixture",
  providerName: "Provider",
  waivesErrorKeys: [],
  waivesWarningKeys: [],
  reservationDedupKey: jest.fn().mockReturnValue("1.5"),
  listFeeOptions: jest.fn(),
  estimateSponsoredFeeQuote: jest.fn(),
  buildEnergyRentRequest: jest.fn().mockResolvedValue(rentRequest),
  craftEnergyRentTransaction: jest.fn().mockResolvedValue(rentOrder()),
  classifyRentOrderError: jest.fn().mockReturnValue(null),
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

function withClockAt<T>(now: number, fn: () => T): T {
  const clock = jest.spyOn(Date, "now").mockReturnValue(now);
  try {
    return fn();
  } finally {
    clock.mockRestore();
  }
}

test("craft failure sets phase FAILED / failureKind RENT_PAYMENT and logs the error", async () => {
  const error = new Error("craft boom");
  const seam = makeSeam({
    craftEnergyRentTransaction: jest.fn().mockRejectedValue(error),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
  expect(result.current.state.rentOrderRejection).toBeNull();
  expect(result.current.state.retryLockedUntil).toBeNull();
  expect(log).toHaveBeenCalledWith("sponsored-send", "rent order failed", { error });
});

test("a craft failure the seam explains keeps its reason", async () => {
  const error = new Error("short");
  const rejection: RentOrderRejection = { reason: "insufficientBalance" };
  const seam = makeSeam({
    buildEnergyRentRequest: jest.fn().mockRejectedValue(error),
    classifyRentOrderError: jest.fn().mockReturnValue(rejection),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
  });

  expect(seam.classifyRentOrderError).toHaveBeenCalledWith(error);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
  expect(result.current.state.rentOrderRejection).toEqual(rejection);
});

describe("an order priced above the approved fee", () => {
  const OFFERED = 3_500_000n;
  const priceRose: RentOrderRejection = {
    reason: "priceAboveApproved",
    offered: { ...RENT_PAYMENT, amount: OFFERED },
  };
  const tooDear = new Error("ceiling");
  const seamPricedAbove = () =>
    makeSeam({
      craftEnergyRentTransaction: jest
        .fn()
        .mockRejectedValueOnce(tooDear)
        .mockResolvedValue(rentOrder()),
      classifyRentOrderError: jest.fn((error: unknown) => (error === tooDear ? priceRose : null)),
    });

  test("fails with the offered price, and Retry orders at it", async () => {
    const seam = seamPricedAbove();
    mockGetSponsoredCoinApi.mockResolvedValue(seam);
    const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));
    await act(async () => {
      await result.current.actions.craftRent(REVIEW_FEE);
    });
    expect(result.current.state.rentOrderRejection).toEqual(priceRose);

    act(() => {
      result.current.actions.retry();
    });
    expect(result.current.state.rentOrderRejection).toBeNull();
    await act(async () => {
      await result.current.actions.craftRent(REVIEW_FEE);
    });

    expect(seam.buildEnergyRentRequest).toHaveBeenLastCalledWith(sendIntent, OFFERED);
    expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);
  });

  test("a reset drops the offered price: the next cycle binds the fee approved for it", async () => {
    const seam = seamPricedAbove();
    mockGetSponsoredCoinApi.mockResolvedValue(seam);
    const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));
    await act(async () => {
      await result.current.actions.craftRent(REVIEW_FEE);
    });

    act(() => {
      result.current.actions.reset();
    });
    await act(async () => {
      await result.current.actions.craftRent(REVIEW_FEE);
    });

    expect(seam.buildEnergyRentRequest).toHaveBeenLastCalledWith(sendIntent, REVIEW_FEE);
  });

  test("a price that can't be shown fails as a plain rent failure, and Retry keeps the fee", async () => {
    const unitless = { ...priceRose, offered: { ...priceRose.offered, asset: { type: "native" } } };
    const seam = makeSeam({
      craftEnergyRentTransaction: jest
        .fn()
        .mockRejectedValueOnce(tooDear)
        .mockResolvedValue(rentOrder()),
      classifyRentOrderError: jest.fn().mockReturnValue(unitless),
    });
    mockGetSponsoredCoinApi.mockResolvedValue(seam);
    const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));
    await act(async () => {
      await result.current.actions.craftRent(REVIEW_FEE);
    });
    expect(result.current.state.rentOrderRejection).toBeNull();

    act(() => {
      result.current.actions.retry();
    });
    await act(async () => {
      await result.current.actions.craftRent(REVIEW_FEE);
    });

    expect(seam.buildEnergyRentRequest).toHaveBeenLastCalledWith(sendIntent, REVIEW_FEE);
  });
});

test.each([
  ["a signable transaction", { transaction: null }],
  ["a payment expiry", { paymentExpiresAt: undefined }],
])("a crafted order without %s fails as RENT_PAYMENT, not CRAFT_SUCCESS", async (_label, gap) => {
  const seam = makeSeam({
    craftEnergyRentTransaction: jest.fn().mockResolvedValue(rentOrder(gap)),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
  expect(result.current.state.order).toBeNull();
  expect(log).toHaveBeenCalledWith("sponsored-send", "rent order failed", {
    error: result.current.state.failureError,
  });
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
    await result.current.actions.craftRent(REVIEW_FEE);
  });

  expect(seam.rentPayment).toHaveBeenCalledTimes(1);
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
  expect(result.current.state.order).toBeNull();
  expect(result.current.state.rentPayment).toBeNull();
});

test("craftRent binds the rent request to the fee approved on Review", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
  });

  expect(seam.buildEnergyRentRequest).toHaveBeenCalledWith(sendIntent, REVIEW_FEE);
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);
});

test("craftRent without an approved fee fails as RENT_PAYMENT without ordering", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(null);
  });

  expect(seam.buildEnergyRentRequest).not.toHaveBeenCalled();
  expect(seam.craftEnergyRentTransaction).not.toHaveBeenCalled();
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
  expect(result.current.state.failureError?.name).toBe("SponsoredFeeNotApprovedError");
});

test.each([
  ["a newer quote", 4_000_000n],
  ["no live quote", null],
])("a retry keeps the fee the cycle was approved at over %s", async (_label, liveFee) => {
  const seam = makeSeam({
    craftEnergyRentTransaction: jest
      .fn()
      .mockRejectedValueOnce(new Error("craft boom"))
      .mockResolvedValue(rentOrder()),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);
  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));
  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
  });

  act(() => {
    result.current.actions.retry();
  });
  await act(async () => {
    await result.current.actions.craftRent(liveFee);
  });

  expect(seam.buildEnergyRentRequest).toHaveBeenLastCalledWith(sendIntent, REVIEW_FEE);
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);
});

test("a reset lets the next cycle bind the fee approved for it", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);
  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));
  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
  });

  act(() => {
    result.current.actions.reset();
  });
  await act(async () => {
    await result.current.actions.craftRent(4_000_000n);
  });

  expect(seam.buildEnergyRentRequest).toHaveBeenLastCalledWith(sendIntent, 4_000_000n);
});

test("buildEnergyRentRequest failure sets phase FAILED / failureKind RENT_PAYMENT", async () => {
  const seam = makeSeam({
    buildEnergyRentRequest: jest.fn().mockRejectedValue(new Error("energy sim boom")),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
  });

  expect(seam.craftEnergyRentTransaction).not.toHaveBeenCalled();
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
});

test("submit failure the provider reports failed -> RENT_PAYMENT, Retry locked until the payment expires", async () => {
  const submitError = new Error("submit boom");
  const seam = makeSeam({
    submitEnergyRentPayment: jest.fn().mockRejectedValue(submitError),
    getEnergyRentStatus: jest.fn().mockResolvedValue("failed"),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);

  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(seam.getEnergyRentStatus).toHaveBeenCalledWith({ orderId: "o1", payerAddress: "TPayer" });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
  expect(result.current.state.retryLockedUntil).toBe(RETRY_UNLOCKS_AT);
  expect(log).toHaveBeenCalledWith("sponsored-send", "rent payment submit failed", {
    error: submitError,
  });

  act(() => withClockAt(RETRY_UNLOCKS_AT - 1, () => result.current.actions.retry()));
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);

  act(() => withClockAt(RETRY_UNLOCKS_AT, () => result.current.actions.retry()));
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);
  expect(result.current.state.retryLockedUntil).toBeNull();
});

test("a payment signed too close to its expiry is never sent, and Retry stays open", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);
  const onRentPaymentBroadcast = jest.fn();

  const { result } = renderHook(() =>
    useSponsoredSendOrchestration({ ...defaultParams, onRentPaymentBroadcast }),
  );
  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
  });

  const clock = jest
    .spyOn(Date, "now")
    .mockReturnValue(PAYMENT_EXPIRES_AT - PAYMENT_EXPIRY_MARGIN_MS);
  try {
    await act(async () => {
      await result.current.actions.startRentPayment("sig", "txA");
    });
  } finally {
    clock.mockRestore();
  }

  expect(seam.buildSignedEnergyRentTransaction).not.toHaveBeenCalled();
  expect(seam.submitEnergyRentPayment).not.toHaveBeenCalled();
  expect(seam.getEnergyRentStatus).not.toHaveBeenCalled();
  expect(onRentPaymentBroadcast).not.toHaveBeenCalled();
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
  expect(result.current.state.failureError?.name).toBe("SponsoredPaymentExpiredError");
  expect(result.current.state.retryLockedUntil).toBeNull();
});

test("a payment signed just inside its window is sent", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);
  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));
  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
  });

  const clock = jest
    .spyOn(Date, "now")
    .mockReturnValue(PAYMENT_EXPIRES_AT - PAYMENT_EXPIRY_MARGIN_MS - 1);
  try {
    await act(async () => {
      await result.current.actions.startRentPayment("sig", "txA");
    });
  } finally {
    clock.mockRestore();
  }

  expect(seam.submitEnergyRentPayment).toHaveBeenCalledTimes(1);
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
});

test("reset while seam resolution is pending skips the irreversible payment submit", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
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
      await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
});

test("delivery timeout the chain then confirms delivered -> proceeds to TRANSFER (salvaged on-chain)", async () => {
  const timeoutError = Object.assign(new Error("timed out"), {
    paymentTxId: "tx-late",
  });
  const seam = makeSeam({
    awaitEnergyDelivery: jest.fn().mockRejectedValue(timeoutError),
    isEnergyDelivered: jest.fn().mockResolvedValue(true),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
  });
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);
  expect(result.current.state.order).toEqual(rentOrder());
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
    await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
  });
  expect(result.current.state.paymentTxId).toBe("txA");

  act(() => {
    result.current.actions.reset();
  });
  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
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
    paymentTxId: "tx-123",
  });
  const seam = makeSeam({
    awaitEnergyDelivery: jest.fn().mockRejectedValue(timeoutError),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
  expect(result.current.state.paymentTxId).toBe("tx-123");
  expect(log).toHaveBeenCalledWith("sponsored-send", "energy delivery failed", {
    error: timeoutError,
  });
});

test("awaitEnergyDelivery order failure -> FAILED / DELIVERY_FAILED (payment already sent)", async () => {
  const seam = makeSeam({
    awaitEnergyDelivery: jest.fn().mockRejectedValue(new Error("order failed")),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
  expect(result.current.state.retryLockedUntil).toBe(RETRY_UNLOCKS_AT);
});

test("an order failure the chain then confirms delivered -> proceeds to TRANSFER", async () => {
  const seam = makeSeam({
    awaitEnergyDelivery: jest.fn().mockRejectedValue(new Error("order failed")),
    isEnergyDelivered: jest.fn().mockResolvedValue(true),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.TRANSFER);
});

test("a poll aborted by reset reports nothing and reads nothing more", async () => {
  const pollStarted = deferred<void>();
  const seam = makeSeam({
    awaitEnergyDelivery: jest.fn(
      (_ref, _target, opts: { signal: AbortSignal }) =>
        new Promise<void>((_resolve, reject) => {
          opts.signal.addEventListener("abort", () => reject(new Error("aborted")));
          pollStarted.resolve();
        }),
    ),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));
  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
  });
  let payPromise!: Promise<void>;
  await act(async () => {
    payPromise = result.current.actions.startRentPayment("sig", "txA");
    await pollStarted.promise;
  });

  await act(async () => {
    result.current.actions.reset();
    await payPromise;
  });

  expect(seam.isEnergyDelivered).not.toHaveBeenCalled();
  expect(log).not.toHaveBeenCalledWith(
    "sponsored-send",
    "energy delivery failed",
    expect.anything(),
  );
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.IDLE);
});

test("onTransferError sets phase FAILED / failureKind TRANSFER", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
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

test("retry from DELIVERY_FAILED -> RENT_SIGNING once the payment expired; retry from TRANSFER -> TRANSFER (order retained)", async () => {
  const seamTimeout = makeSeam({
    awaitEnergyDelivery: jest.fn().mockRejectedValue(new Error("timed out")),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seamTimeout);

  const timeoutHook = renderHook(() => useSponsoredSendOrchestration(defaultParams));
  await act(async () => {
    await timeoutHook.result.current.actions.craftRent(REVIEW_FEE);
  });
  await act(async () => {
    await timeoutHook.result.current.actions.startRentPayment("sig", "txA");
  });
  expect(timeoutHook.result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
  expect(timeoutHook.result.current.state.retryLockedUntil).toBe(RETRY_UNLOCKS_AT);

  act(() => withClockAt(RETRY_UNLOCKS_AT - 1, () => timeoutHook.result.current.actions.retry()));
  expect(timeoutHook.result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);

  act(() => withClockAt(RETRY_UNLOCKS_AT, () => timeoutHook.result.current.actions.retry()));
  expect(timeoutHook.result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);
  expect(timeoutHook.result.current.state.retryLockedUntil).toBeNull();
  expect(timeoutHook.result.current.state.order).toBeNull();
  expect(timeoutHook.result.current.state.rentPayment).toBeNull();

  // --- separate hook instance for the TRANSFER-failure retry ---
  const seamTransfer = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seamTransfer);

  const transferHook = renderHook(() => useSponsoredSendOrchestration(defaultParams));
  await act(async () => {
    await transferHook.result.current.actions.craftRent(REVIEW_FEE);
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

test("onTransferSuccess sets phase DONE", async () => {
  const seam = makeSeam();
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
  });
  act(() => {
    result.current.actions.reset();
  });
  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
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
    paymentTxId: "real-tx-A",
  });
  const seam = makeSeam({
    awaitEnergyDelivery: jest.fn().mockRejectedValue(timeoutError),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
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
    paymentTxId: "stale-tx",
  });
  const seam = makeSeam({
    awaitEnergyDelivery: jest.fn().mockRejectedValue(timeoutError),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
  });
  await act(async () => {
    await result.current.actions.startRentPayment("sig", "txA");
  });
  expect(result.current.state.paymentTxId).toBe("stale-tx");

  act(() => withClockAt(RETRY_UNLOCKS_AT, () => result.current.actions.retry()));
  expect(result.current.state.phase).toBe(SPONSORED_PHASE.RENT_SIGNING);
  expect(result.current.state.paymentTxId).toBeNull();

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
  });
  expect(result.current.state.paymentTxId).toBe("txA");
});

test("a getSeam rejection in craftRent lands in FAILED / RENT_PAYMENT, not an unhandled rejection", async () => {
  mockGetSponsoredCoinApi.mockRejectedValue(new Error("resolver down"));

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
  });

  expect(result.current.state.phase).toBe(SPONSORED_PHASE.FAILED);
  expect(result.current.state.failureKind).toBe(SPONSORED_FAILURE_KIND.RENT_PAYMENT);
});

test("seam null -> craftRent fails the flow instead of silently no-op'ing", async () => {
  mockGetSponsoredCoinApi.mockResolvedValue(null);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
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
      return craftGate.promise.then(() => rentOrder({ orderId: "stale" }));
    }),
  });
  mockGetSponsoredCoinApi.mockResolvedValue(seam);

  const { result } = renderHook(() => useSponsoredSendOrchestration(defaultParams));

  let craftPromise!: Promise<void>;
  await act(async () => {
    craftPromise = result.current.actions.craftRent(REVIEW_FEE);
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

const order = (id: string) => rentOrder({ orderId: `o${id}`, transaction: { id } });

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
    olderCraft = result.current.actions.craftRent(REVIEW_FEE);
    await olderCalled.promise;
  });
  await act(async () => {
    await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
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
      await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
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
    await result.current.actions.craftRent(REVIEW_FEE);
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
