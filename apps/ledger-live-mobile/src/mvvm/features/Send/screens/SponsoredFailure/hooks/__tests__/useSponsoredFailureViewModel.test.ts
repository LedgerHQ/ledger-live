import { act, renderHook } from "@testing-library/react-native";
import { BigNumber } from "bignumber.js";
import { track } from "@shared/analytics";
import { SPONSORED_FAILURE_KIND } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useSponsoredFailureViewModel } from "../useSponsoredFailureViewModel";

const mockClose = jest.fn();
const mockOperationRetry = jest.fn();
const mockResetStatus = jest.fn();
const mockRetry = jest.fn();
let mockSponsoredState: Record<string, unknown>;
let mockMainAccount: Record<string, unknown> | null;
let mockFeeCurrencyTicker: string;

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params ? `${key} ${JSON.stringify(params)}` : key,
  }),
}));
jest.mock("~/context/hooks", () => ({
  useSelector: (selector: () => unknown) => selector(),
}));
jest.mock("~/reducers/settings", () => ({
  localeSelector: () => "en-GB",
}));
jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: () => ({
    state: {
      account: { account: { id: "usdt" } },
      transaction: { transaction: { amount: new BigNumber(1_000_000), useAllAmount: false } },
    },
  }),
  useSendFlowActions: () => ({
    close: mockClose,
    operation: { onRetry: mockOperationRetry },
    status: { resetStatus: mockResetStatus },
  }),
}));
jest.mock("../../../../hooks/useSendFlowTrackingProperties", () => ({
  useSendFlowTrackingProperties: () => ({ flow: "send" }),
}));
jest.mock("../../../../context/SendFlowTrackingContext", () => ({
  useSendFlowTracking: () => ({ flowSessionId: "session-1" }),
}));
jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => ({
    state: mockSponsoredState,
    actions: { retry: mockRetry },
    providerName: "Provider",
    feeCurrencyTicker: mockFeeCurrencyTicker,
    mainAccount: mockMainAccount,
  }),
}));

const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const RENT_PAYMENT = {
  asset: {
    type: "trc20",
    assetReference: USDT_CONTRACT,
    unit: { name: "USDT", code: "USDT", magnitude: 6 },
  },
  amount: 3_200_000n,
};
const holdingUsdt = (spendable: number) => ({
  id: "tron",
  subAccounts: [
    {
      id: "usdt",
      token: { contractAddress: USDT_CONTRACT },
      spendableBalance: new BigNumber(spendable),
      pendingOperations: [],
    },
  ],
});

const failed = (failureKind: string, overrides: Record<string, unknown> = {}) => ({
  failureKind,
  failureError: new Error("boom"),
  paymentTxId: null,
  rentPayment: RENT_PAYMENT,
  rentOrderRejection: null,
  retryLockedUntil: null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockMainAccount = holdingUsdt(10_000_000);
  mockFeeCurrencyTicker = "USDT";
});

describe("useSponsoredFailureViewModel", () => {
  it.each([
    [SPONSORED_FAILURE_KIND.RENT_PAYMENT, "send.newSendFlow.sponsoredFailure.rentPayment"],
    [SPONSORED_FAILURE_KIND.TRANSFER, "send.newSendFlow.sponsoredFailure.transfer"],
  ])("explains a %s failure and offers a plain retry", (failureKind, messageKey) => {
    mockSponsoredState = failed(failureKind);

    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.message).toContain(messageKey);
    expect(result.current.retryLabel).toBe("send.newSendFlow.sponsoredFailure.retry");
    expect(result.current.retryDisabled).toBe(false);
  });

  it("names the provider and the paid TX-A on a delivery failure, and warns the retry pays again", () => {
    mockSponsoredState = failed(SPONSORED_FAILURE_KIND.DELIVERY_FAILED, { paymentTxId: "txA" });

    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.message).toContain("send.newSendFlow.sponsoredFailure.deliveryFailed");
    expect(result.current.message).toContain('"provider":"Provider"');
    expect(result.current.message).toContain('"txidSuffix":" (txA)"');
    expect(result.current.retryLabel).toBe("send.newSendFlow.sponsoredFailure.retryPaying");
  });

  it("reports a short fee-token balance from the craft as insufficient funds", () => {
    mockSponsoredState = failed(SPONSORED_FAILURE_KIND.RENT_PAYMENT, {
      rentOrderRejection: { reason: "insufficientBalance" },
    });

    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.message).toContain("send.newSendFlow.feePayment.insufficientFunds");
    expect(result.current.retryBlockedMessage).toBeNull();
  });

  describe("an order priced above the approved fee", () => {
    const priceRose = failed(SPONSORED_FAILURE_KIND.RENT_PAYMENT, {
      rentPayment: null,
      rentOrderRejection: {
        reason: "priceAboveApproved",
        offered: { ...RENT_PAYMENT, amount: 3_500_000n },
      },
    });

    it("shows the new price and offers to accept it", () => {
      mockSponsoredState = priceRose;

      const { result } = renderHook(() => useSponsoredFailureViewModel());
      act(() => result.current.onRetry());

      expect(result.current.message).toContain("send.newSendFlow.sponsoredFailure.priceIncreased");
      expect(result.current.message).toMatch(/"fee":"3\.5\sUSDT"/);
      expect(result.current.retryLabel).toBe("send.newSendFlow.sponsoredFailure.acceptPrice");
      expect(mockRetry).toHaveBeenCalled();
    });

    it("keeps Accept off when the balance can't pay the new price next to the amount", () => {
      mockMainAccount = holdingUsdt(4_400_000);
      mockSponsoredState = priceRose;

      const { result } = renderHook(() => useSponsoredFailureViewModel());
      act(() => result.current.onRetry());

      expect(result.current.retryDisabled).toBe(true);
      expect(result.current.retryBlockedMessage).toContain(
        "send.newSendFlow.feePayment.insufficientFunds",
      );
      expect(mockRetry).not.toHaveBeenCalled();
    });
  });

  describe("while the first payment may still land", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it.each([SPONSORED_FAILURE_KIND.DELIVERY_FAILED, SPONSORED_FAILURE_KIND.RENT_PAYMENT])(
      "keeps Retry off after %s until the payment expires, and says until when",
      failureKind => {
        const lockedUntil = new Date("2026-10-08T14:32:10").getTime();
        jest.setSystemTime(lockedUntil - 60_000);
        mockSponsoredState = failed(failureKind, { retryLockedUntil: lockedUntil });
        const { result } = renderHook(() => useSponsoredFailureViewModel());

        act(() => result.current.onRetry());
        expect(result.current.retryDisabled).toBe(true);
        expect(result.current.retryBlockedMessage).toBe(
          'send.newSendFlow.sponsoredFailure.retryLocked {"time":"14:33"}',
        );
        expect(mockRetry).not.toHaveBeenCalled();
        expect(track).not.toHaveBeenCalled();

        act(() => jest.advanceTimersByTime(60_000));
        act(() => result.current.onRetry());

        expect(result.current.retryDisabled).toBe(false);
        expect(result.current.retryBlockedMessage).toBeNull();
        expect(mockRetry).toHaveBeenCalled();
      },
    );

    it("says a payment the provider reported failed may still go through", () => {
      mockSponsoredState = failed(SPONSORED_FAILURE_KIND.RENT_PAYMENT, {
        retryLockedUntil: Date.now() + 60_000,
      });

      const { result } = renderHook(() => useSponsoredFailureViewModel());

      expect(result.current.message).toContain(
        "send.newSendFlow.sponsoredFailure.rentPaymentReportedFailed",
      );
      expect(result.current.message).toContain('"provider":"Provider"');
    });

    it("names the short balance rather than the lock when both block the retry", () => {
      mockMainAccount = holdingUsdt(4_000_000);
      mockSponsoredState = failed(SPONSORED_FAILURE_KIND.DELIVERY_FAILED, {
        retryLockedUntil: Date.now() + 60_000,
      });

      const { result } = renderHook(() => useSponsoredFailureViewModel());

      expect(result.current.retryBlockedMessage).toContain(
        "send.newSendFlow.feePayment.insufficientFunds",
      );
    });
  });

  // The live quote drops its fee asset once the option is withdrawn; the paid rent keeps it.
  it("allows a delivery-failure retry the fee token covers, after the option is withdrawn", () => {
    mockFeeCurrencyTicker = "";
    mockSponsoredState = failed(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    act(() => result.current.onRetry());

    expect(result.current.retryDisabled).toBe(false);
    expect(mockRetry).toHaveBeenCalled();
  });

  it("names the paid rent's currency once the quote's is gone", () => {
    mockFeeCurrencyTicker = "";
    mockMainAccount = holdingUsdt(4_000_000);
    mockSponsoredState = failed(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);

    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.retryBlockedMessage).toContain('"feeCurrency":"USDT"');
  });

  it("blocks a delivery-failure retry the fee token can't pay again", () => {
    mockMainAccount = holdingUsdt(4_000_000);
    mockSponsoredState = failed(SPONSORED_FAILURE_KIND.DELIVERY_FAILED);
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    act(() => result.current.onRetry());

    expect(result.current.retryDisabled).toBe(true);
    expect(result.current.retryBlockedMessage).toContain(
      "send.newSendFlow.feePayment.insufficientFunds",
    );
    expect(mockRetry).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it("clears the failed transfer's status before retrying", () => {
    mockSponsoredState = failed(SPONSORED_FAILURE_KIND.TRANSFER);
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    act(() => result.current.onRetry());

    expect(mockOperationRetry).toHaveBeenCalled();
    expect(mockResetStatus).toHaveBeenCalled();
    expect(mockRetry).toHaveBeenCalled();
  });

  it("closes the flow on cancel", () => {
    mockSponsoredState = failed(SPONSORED_FAILURE_KIND.TRANSFER);
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    act(() => result.current.onCancel());

    expect(mockClose).toHaveBeenCalled();
  });

  it.each([
    ["retry", "onRetry"],
    ["cancel", "onCancel"],
  ] as const)("tracks the %s click with the failure kind", (button, handler) => {
    mockSponsoredState = failed(SPONSORED_FAILURE_KIND.TRANSFER);
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    act(() => result.current[handler]());

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button,
      page: "step sponsored failure",
      failure_kind: SPONSORED_FAILURE_KIND.TRANSFER,
      flow_session_id: "session-1",
      flow: "send",
    });
  });
});
