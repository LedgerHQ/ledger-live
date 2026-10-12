import { BigNumber } from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { RentOrderRejection } from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import { act, renderHook } from "tests/testSetup";
import {
  TRON_USDT_FEE_ASSET,
  createMockTronUsdtAccount,
} from "../../../Recipient/__integrations__/__fixtures__/accounts";
import { buildRentReservationOperation } from "@ledgerhq/live-common/flows/send/sponsored/rentReservation";
import { useSponsoredFailureViewModel } from "../useSponsoredFailureViewModel";

const mockClose = jest.fn();
const mockOperationRetry = jest.fn();
const mockResetStatus = jest.fn();
let mockSendingAccount: TokenAccount | null = null;
let mockTransaction: { amount: BigNumber; useAllAmount: boolean } | null = null;
jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: () => ({
    state: {
      account: { account: mockSendingAccount },
      transaction: { transaction: mockTransaction },
    },
  }),
  useSendFlowActions: () => ({
    close: mockClose,
    operation: { onRetry: mockOperationRetry },
    status: { resetStatus: mockResetStatus },
  }),
}));

const mockRetry = jest.fn();
let mockSponsoredState: {
  phase: string;
  failureKind: string | null;
  paymentTxId: string | null;
  rentPayment?: { asset: typeof TRON_USDT_FEE_ASSET; amount: bigint } | null;
  rentOrderRejection?: RentOrderRejection | null;
  retryLockedUntil?: number | null;
};
let mockMainAccount: Account | null = null;

jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => ({
    state: { rentOrderRejection: null, retryLockedUntil: null, ...mockSponsoredState },
    actions: { retry: mockRetry },
    providerName: "Provider",
    feeCurrencyTicker: "USDT",
    mainAccount: mockMainAccount,
  }),
}));

describe("useSponsoredFailureViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSponsoredState = { phase: "FAILED", failureKind: "RENT_PAYMENT", paymentTxId: null };
    mockSendingAccount = null;
    mockTransaction = null;
    mockMainAccount = null;
  });

  it("renders the RENT_PAYMENT message", () => {
    mockSponsoredState = { phase: "FAILED", failureKind: "RENT_PAYMENT", paymentTxId: null };
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.message).toBe("Fee payment failed — your funds were not moved.");
  });

  it("names the fee currency when the balance can't cover the amount and the rent", () => {
    mockSponsoredState = {
      phase: "FAILED",
      failureKind: "RENT_PAYMENT",
      paymentTxId: null,
      rentOrderRejection: { reason: "insufficientBalance" },
    };
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.message).toBe(
      "You don't have enough USDT to cover the amount and the Provider energy rental fee.",
    );
  });

  it("shows the new price of an order above the approved fee and offers to accept it", () => {
    mockSponsoredState = {
      phase: "FAILED",
      failureKind: "RENT_PAYMENT",
      paymentTxId: null,
      rentOrderRejection: {
        reason: "priceAboveApproved",
        offered: { asset: TRON_USDT_FEE_ASSET, amount: 3_500_000n },
      },
    };
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.message).toMatch(
      /^The energy rental price went up to 3\.5\sUSDT\. Your funds were not moved\.$/,
    );
    expect(result.current.retryLabel).toBe("Accept new price");
    expect(result.current.retryDisabled).toBe(false);

    result.current.onRetry();

    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it("keeps Accept off when the balance can't pay the new price next to the amount", () => {
    const feeToken = createMockTronUsdtAccount({
      balance: new BigNumber(4_400_000),
      spendableBalance: new BigNumber(4_400_000),
    });
    mockSendingAccount = feeToken;
    mockMainAccount = { id: "mock_account_id", subAccounts: [feeToken] } as unknown as Account;
    mockTransaction = { amount: new BigNumber(1_000_000), useAllAmount: false };
    mockSponsoredState = {
      phase: "FAILED",
      failureKind: "RENT_PAYMENT",
      paymentTxId: null,
      rentOrderRejection: {
        reason: "priceAboveApproved",
        offered: { asset: TRON_USDT_FEE_ASSET, amount: 3_500_000n },
      },
    };
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.retryDisabled).toBe(true);
    expect(result.current.retryBlockedMessage).toBe(
      "You don't have enough USDT to cover the amount and the Provider energy rental fee.",
    );

    result.current.onRetry();

    expect(mockRetry).not.toHaveBeenCalled();
  });

  it("renders the DELIVERY_FAILED message with the paymentTxId interpolated", () => {
    mockSponsoredState = {
      phase: "FAILED",
      failureKind: "DELIVERY_FAILED",
      paymentTxId: "0xabc123",
    };
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.message).toBe(
      "Energy was not delivered. Your rental fee payment was sent — contact Provider support for a refund (0xabc123).",
    );
  });

  it("omits the txid parenthetical entirely when paymentTxId is null", () => {
    mockSponsoredState = { phase: "FAILED", failureKind: "DELIVERY_FAILED", paymentTxId: null };
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.message).not.toContain("null");
    expect(result.current.message).not.toContain("()");
    expect(result.current.message).toBe(
      "Energy was not delivered. Your rental fee payment was sent — contact Provider support for a refund.",
    );
  });

  it("warns that retrying DELIVERY_FAILED costs a second rental fee", () => {
    mockSponsoredState = { phase: "FAILED", failureKind: "DELIVERY_FAILED", paymentTxId: null };
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.retryLabel).toBe("Pay again and retry");
  });

  describe("retrying a delivery failure", () => {
    const RENT = 3_000n;

    // Sending 5 000 of a 10 000 USDT balance: a second 3 000 rent fits, unless the first is still
    // pending as a reservation.
    function setUpDeliveryFailure(firstRentPending: boolean) {
      const reservation = buildRentReservationOperation({
        tokenAccountId: "mock_tron_usdt_account_id",
        payerAddress: "TPayer",
        paymentTxId: "txA",
        rentAmount: RENT,
        reservationSequence: "1.5",
      });
      const feeToken = createMockTronUsdtAccount({
        balance: new BigNumber(10_000),
        spendableBalance: new BigNumber(10_000),
        pendingOperations: firstRentPending && reservation ? [reservation] : [],
      });
      mockSendingAccount = feeToken;
      mockMainAccount = { id: "mock_account_id", subAccounts: [feeToken] } as unknown as Account;
      mockTransaction = { amount: new BigNumber(5_000), useAllAmount: false };
      mockSponsoredState = {
        phase: "FAILED",
        failureKind: "DELIVERY_FAILED",
        paymentTxId: "txA",
        rentPayment: { asset: TRON_USDT_FEE_ASSET, amount: RENT },
      };
    }

    it("blocks the retry when the pending first rent leaves too little for a second", () => {
      setUpDeliveryFailure(true);
      const { result } = renderHook(() => useSponsoredFailureViewModel());

      expect(result.current.retryDisabled).toBe(true);
      expect(result.current.retryBlockedMessage).toBe(
        "You don't have enough USDT to cover the amount and the Provider energy rental fee.",
      );

      result.current.onRetry();

      expect(mockRetry).not.toHaveBeenCalled();
    });

    it("allows the retry when the balance covers the amount and a second rent", () => {
      setUpDeliveryFailure(false);
      const { result } = renderHook(() => useSponsoredFailureViewModel());

      expect(result.current.retryDisabled).toBe(false);
      expect(result.current.retryBlockedMessage).toBeNull();

      result.current.onRetry();

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it("names the short balance rather than the lock when both block the retry", () => {
      setUpDeliveryFailure(true);
      mockSponsoredState.retryLockedUntil = Date.now() + 60_000;
      const { result } = renderHook(() => useSponsoredFailureViewModel());

      expect(result.current.retryBlockedMessage).toBe(
        "You don't have enough USDT to cover the amount and the Provider energy rental fee.",
      );
    });
  });

  describe("while the first payment may still land", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it.each(["DELIVERY_FAILED", "RENT_PAYMENT"])(
      "keeps Retry off after %s until the payment expires, and says until when",
      failureKind => {
        const lockedUntil = new Date("2026-10-08T14:32:10").getTime();
        jest.setSystemTime(lockedUntil - 60_000);
        mockSponsoredState = {
          phase: "FAILED",
          failureKind,
          paymentTxId: null,
          retryLockedUntil: lockedUntil,
        };
        const { result } = renderHook(() => useSponsoredFailureViewModel());

        expect(result.current.retryDisabled).toBe(true);
        expect(result.current.retryBlockedMessage).toMatch(
          /^So you don't pay the rental twice, you can retry after .*:33\b.*\.$/,
        );
        result.current.onRetry();
        expect(mockRetry).not.toHaveBeenCalled();

        act(() => jest.advanceTimersByTime(60_000));

        expect(result.current.retryDisabled).toBe(false);
        expect(result.current.retryBlockedMessage).toBeNull();
        result.current.onRetry();
        expect(mockRetry).toHaveBeenCalledTimes(1);
      },
    );

    it("says a payment the provider reported failed may still go through", () => {
      mockSponsoredState = {
        phase: "FAILED",
        failureKind: "RENT_PAYMENT",
        paymentTxId: null,
        retryLockedUntil: Date.now() + 60_000,
      };
      const { result } = renderHook(() => useSponsoredFailureViewModel());

      expect(result.current.message).toBe(
        "Provider reported the fee payment as failed, but it may still go through.",
      );
    });
  });

  it.each(["RENT_PAYMENT", "TRANSFER"])(
    "keeps the plain retry label for %s, where retrying costs nothing extra",
    failureKind => {
      mockSponsoredState = { phase: "FAILED", failureKind, paymentTxId: null };
      const { result } = renderHook(() => useSponsoredFailureViewModel());

      expect(result.current.retryLabel).toBe("Retry");
    },
  );

  it("renders the TRANSFER message", () => {
    mockSponsoredState = { phase: "FAILED", failureKind: "TRANSFER", paymentTxId: null };
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.message).toBe(
      "Your transfer failed, but the rented energy is still valid — you can retry the transfer.",
    );
  });

  it("renders nothing crash-free for a null failureKind", () => {
    mockSponsoredState = { phase: "FAILED", failureKind: null, paymentTxId: null };
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.message).toBeNull();
  });

  it("clears the failed operation and flow status, then calls actions.retry() on retry", () => {
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    result.current.onRetry();

    expect(mockOperationRetry).toHaveBeenCalledTimes(1);
    expect(mockResetStatus).toHaveBeenCalledTimes(1);
    expect(mockRetry).toHaveBeenCalledTimes(1);
    const [retryOrder] = mockRetry.mock.invocationCallOrder;
    expect(mockOperationRetry.mock.invocationCallOrder[0]).toBeLessThan(retryOrder);
    expect(mockResetStatus.mock.invocationCallOrder[0]).toBeLessThan(retryOrder);
  });

  it("calls close() on cancel", () => {
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    result.current.onCancel();

    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
