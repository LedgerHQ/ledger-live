import React from "react";
import { act, renderHook } from "@testing-library/react-native";
import { BigNumber } from "bignumber.js";
import { track } from "@shared/analytics";
import {
  SPONSORED_PHASE,
  type SponsoredPhase,
} from "@ledgerhq/live-common/flows/send/sponsored/types";
import {
  STANDARD_FEE_OPTION_ID,
  SponsoredSendProvider,
  useIsSponsoredSelected,
  useSponsoredSend,
} from "../SponsoredSendContext";

type MockTransaction = { amount: BigNumber; useAllAmount: boolean; sponsored?: boolean };

const mockUpdateTransaction = jest.fn();
const mockDispatch = jest.fn();
const mockReset = jest.fn();
let mockTransaction: MockTransaction;
let mockPhase: SponsoredPhase;
let mockRentPayment: { asset: unknown; amount: bigint } | null;
let mockIsSigning: boolean;
let mockRentArriving: boolean;
let mockRentDeliveredAt: number | null;
let mockUnmemoizedUpdateTransaction: boolean;
let mockQuoteResult: Record<string, unknown>;
const mockQuoteWithoutSeam = {
  available: false,
  quote: null,
  feeAsset: null,
  feeTokenAccount: null,
  standardFeeFiat: null,
  sponsoredFeeFiat: null,
  savingsFiat: null,
  feeCurrencyTicker: "",
  loading: false,
};
const mockUseSponsoredFeeQuote = jest.fn((params: { seam: unknown }) =>
  params.seam ? mockQuoteResult : mockQuoteWithoutSeam,
);
const mockFeeAmounts = {
  sponsored: { value: "€2.80", secondaryValue: "3.2 USDT", originalValue: "€3.60" },
  standard: { value: "€3.60", secondaryValue: "13 TRX" },
};
const mockFormatSponsoredFeeAmounts = jest.fn((..._args: unknown[]) => mockFeeAmounts);
const TRX_UNIT = { name: "TRX", code: "TRX", magnitude: 6 };
const USDT_UNIT = { name: "USDT", code: "USDT", magnitude: 6 };

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: () => ({ enabled: true }),
}));
jest.mock("~/context/hooks", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: () => unknown) => selector(),
}));
jest.mock("~/reducers/settings", () => ({
  counterValueCurrencySelector: () => ({ units: [{ name: "Euro", code: "EUR", magnitude: 2 }] }),
}));
jest.mock("LLM/hooks/useAccountUnit", () => ({
  useMaybeAccountUnit: () => TRX_UNIT,
}));
jest.mock("../SendSignatureContext", () => ({
  useSendSignature: () => ({ isSigning: mockIsSigning }),
}));
jest.mock("~/actions/accounts", () => ({
  updateAccountWithUpdater: (payload: unknown) => ({ type: "UPDATE", payload }),
}));
jest.mock("../SendFlowContext", () => ({
  useSendFlowData: () => ({
    state: {
      account: { account: { id: "usdt" }, parentAccount: { id: "tron" } },
      transaction: { transaction: mockTransaction },
    },
  }),
  useSendFlowActions: () => ({
    transaction: {
      updateTransaction: mockUnmemoizedUpdateTransaction
        ? (...args: unknown[]) => mockUpdateTransaction(...args)
        : mockUpdateTransaction,
    },
  }),
}));
jest.mock("@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendSession", () => ({
  useSponsoredSendSession: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/flows/send/sponsored/useSponsoredFeeQuote", () => ({
  useSponsoredFeeQuote: (params: { seam: unknown }) => mockUseSponsoredFeeQuote(params),
}));
jest.mock("@ledgerhq/live-common/flows/send/sponsored/feeAmounts", () => ({
  formatSponsoredFeeAmounts: (...args: unknown[]) => mockFormatSponsoredFeeAmounts(...args),
}));
const mockUseSponsoredSendFunnelTracking = jest.fn();
jest.mock("@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendFunnelTracking", () => ({
  useSponsoredSendFunnelTracking: (...args: unknown[]) =>
    mockUseSponsoredSendFunnelTracking(...args),
}));
jest.mock("../SendFlowTrackingContext", () => ({
  useSendFlowTracking: () => ({ flowSessionId: "session-1" }),
}));
jest.mock("../../hooks/useSendFlowTrackingProperties", () => ({
  useSendFlowTrackingProperties: () => ({ flow: "send" }),
}));

const { useSponsoredSendSession } = jest.requireMock(
  "@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendSession",
);

const SEAM = {
  feeOptionId: "sponsored",
  providerName: "Provider",
  waivesErrorKeys: ["gasPrice"],
  waivesWarningKeys: ["amount"],
};
const QUOTE = {
  feeAsset: { type: "trc20", unit: USDT_UNIT },
  value: 3_200_000n,
  originalValue: 13_000_000n,
};
const feeTokenAccount = {
  id: "usdt",
  spendableBalance: new BigNumber(10_000_000),
  pendingOperations: [],
};
// 10 USDT spendable, less the 3.2 USDT rent and its 1% margin.
const SNAPPED_MAX = new BigNumber(6_768_000);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SponsoredSendProvider>{children}</SponsoredSendProvider>
);

const renderContext = () =>
  renderHook(() => ({ value: useSponsoredSend(), selected: useIsSponsoredSelected() }), {
    wrapper,
  });

/** Applies every `updateTransaction` updater so far, the way the send flow's store does. */
const applyUpdates = () => {
  for (const [updater] of mockUpdateTransaction.mock.calls) {
    mockTransaction = updater(mockTransaction);
  }
  mockUpdateTransaction.mockClear();
};

const renderSelected = () => {
  const rendered = renderContext();
  act(() => rendered.result.current.value.selectSponsored());
  applyUpdates();
  rendered.rerender({});
  applyUpdates();
  rendered.rerender({});
  return rendered;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockTransaction = { amount: new BigNumber(1_000_000), useAllAmount: false };
  mockPhase = SPONSORED_PHASE.IDLE;
  mockRentPayment = null;
  mockIsSigning = false;
  mockRentArriving = false;
  mockRentDeliveredAt = null;
  mockUnmemoizedUpdateTransaction = false;
  mockQuoteResult = {
    available: true,
    quote: QUOTE,
    savingsFiat: new BigNumber(80),
    standardFeeFiat: new BigNumber(360),
    sponsoredFeeFiat: new BigNumber(280),
    feeCurrencyTicker: "USDT",
    feeTokenAccount,
  };
  const actions = { reset: mockReset };
  (useSponsoredSendSession as jest.Mock).mockImplementation(() => ({
    mainAccount: { id: "tron" },
    seam: SEAM,
    intent: { built: true },
    intentFailed: false,
    state: { phase: mockPhase, rentPayment: mockRentPayment },
    actions,
    rentArriving: mockRentArriving,
    rentDeliveredAt: mockRentDeliveredAt,
  }));
});

describe("SponsoredSendProvider", () => {
  it("starts on the standard fee and leaves the transaction untouched", () => {
    const { result } = renderContext();

    expect(result.current.selected).toBe(false);
    expect(result.current.value.selectedFeeOptionId).toBe(STANDARD_FEE_OPTION_ID);
    expect(mockUpdateTransaction).not.toHaveBeenCalled();
  });

  it("exposes the seam's identity and the quote's availability", () => {
    const { result } = renderContext();

    expect(result.current.value).toMatchObject({
      mainAccount: { id: "tron" },
      sponsoredFeeOptionId: "sponsored",
      providerName: "Provider",
      waivesErrorKeys: ["gasPrice"],
      waivesWarningKeys: ["amount"],
      waivesNativeFee: false,
      reviewReady: true,
      feeCurrencyTicker: "USDT",
      available: true,
      feeTokenAccount,
      sponsoredUnaffordable: false,
      approvedFee: QUOTE.value,
    });
  });

  it("marks the transaction sponsored on selectSponsored, and clears it on selectStandard", () => {
    const { result, rerender } = renderContext();

    act(() => result.current.value.selectSponsored());
    applyUpdates();
    rerender({});

    expect(result.current.selected).toBe(true);
    expect(result.current.value.waivesNativeFee).toBe(true);
    expect(mockTransaction.sponsored).toBe(true);

    act(() => result.current.value.selectStandard());
    applyUpdates();
    rerender({});

    expect(result.current.selected).toBe(false);
    expect(mockTransaction.sponsored).toBe(false);
  });

  it("ignores selectSponsored while no seam has resolved", () => {
    (useSponsoredSendSession as jest.Mock).mockImplementation(() => ({
      mainAccount: { id: "tron" },
      seam: null,
      intent: null,
      intentFailed: false,
      state: { phase: mockPhase },
      actions: { reset: mockReset },
      rentArriving: false,
      rentDeliveredAt: null,
    }));
    const { result } = renderContext();

    act(() => result.current.value.selectSponsored());

    expect(result.current.selected).toBe(false);
    expect(mockUpdateTransaction).not.toHaveBeenCalled();
  });

  it("prices the sponsored fee in the fee asset's unit and the standard fee in the account's", () => {
    const { result } = renderContext();

    expect(result.current.value.sponsoredFeeAmounts).toBe(mockFeeAmounts);
    expect(mockFormatSponsoredFeeAmounts).toHaveBeenLastCalledWith(
      expect.objectContaining({
        quote: QUOTE,
        feeUnit: USDT_UNIT,
        nativeUnit: TRX_UNIT,
        sponsoredFeeFiat: new BigNumber(280),
        standardFeeFiat: new BigNumber(360),
      }),
    );
  });

  it("has no fee amounts before a quote", () => {
    mockQuoteResult = { ...mockQuoteResult, quote: null };
    const { result } = renderContext();

    expect(result.current.value.sponsoredFeeAmounts).toBeNull();
  });

  it("formats a saving in the countervalue, and hides one that isn't positive", () => {
    const { result, rerender } = renderContext();
    expect(result.current.value.savingsFiatFormatted).toMatch(/^0\.8\sEUR$/);

    mockQuoteResult = { ...mockQuoteResult, savingsFiat: new BigNumber(0) };
    rerender({});

    expect(result.current.value.savingsFiatFormatted).toBeNull();
  });

  it("withdraws the option when the intent build fails", () => {
    (useSponsoredSendSession as jest.Mock).mockImplementation(() => ({
      mainAccount: { id: "tron" },
      seam: SEAM,
      intent: null,
      intentFailed: true,
      state: { phase: mockPhase },
      actions: { reset: mockReset },
      rentArriving: false,
      rentDeliveredAt: null,
    }));

    renderContext();

    expect(mockUseSponsoredFeeQuote).toHaveBeenLastCalledWith(
      expect.objectContaining({ intentFailed: true }),
    );
  });

  it.each([
    [SPONSORED_PHASE.IDLE, true],
    [SPONSORED_PHASE.RENT_SIGNING, false],
    [SPONSORED_PHASE.FAILED, false],
  ])("refreshes the quote in phase %s: %s", (phase, refresh) => {
    mockPhase = phase;
    renderContext();

    expect(mockUseSponsoredFeeQuote).toHaveBeenLastCalledWith(expect.objectContaining({ refresh }));
  });

  it("holds Review while the sponsored pick's quote reloads, and keeps waiving meanwhile", () => {
    const { result, rerender } = renderSelected();
    expect(result.current.value.reviewReady).toBe(true);

    mockQuoteResult = { ...mockQuoteResult, quote: null };
    rerender({});

    expect(result.current.selected).toBe(true);
    expect(result.current.value.reviewReady).toBe(false);
    expect(result.current.value.waivesNativeFee).toBe(true);
    expect(result.current.value.approvedFee).toBeNull();
  });

  it("keeps Review ready on the standard fee while no quote is offered", () => {
    mockQuoteResult = { ...mockQuoteResult, available: false, quote: null };
    const { result } = renderContext();

    expect(result.current.value.reviewReady).toBe(true);
  });

  it("flags a sponsored pick the fee token can't cover, and blocks nothing on the standard fee", () => {
    mockTransaction = { amount: new BigNumber(9_000_000), useAllAmount: false };
    const { result, rerender } = renderContext();
    expect(result.current.value.sponsoredUnaffordable).toBe(false);

    act(() => result.current.value.selectSponsored());
    applyUpdates();
    rerender({});

    expect(result.current.selected).toBe(true);
    expect(result.current.value.sponsoredUnaffordable).toBe(true);
  });

  it("reverts to the standard fee when the option disappears", () => {
    const { result, rerender } = renderSelected();
    expect(result.current.selected).toBe(true);

    mockQuoteResult = { ...mockQuoteResult, available: false, quote: null };
    rerender({});
    applyUpdates();

    expect(result.current.selected).toBe(false);
    expect(mockTransaction.sponsored).toBe(false);
  });

  // TX-A is paid by then, and coin-tron stops listing the option once the energy is delivered.
  it("keeps the pick and Review ready past IDLE after the option is withdrawn", () => {
    const { result, rerender } = renderSelected();

    mockPhase = SPONSORED_PHASE.TRANSFER;
    mockQuoteResult = { ...mockQuoteResult, available: false, quote: null };
    rerender({});

    expect(result.current.selected).toBe(true);
    expect(result.current.value.reviewReady).toBe(true);
    expect(result.current.value.waivesNativeFee).toBe(true);
  });

  it("shows the rent TX-A pays, in its asset, for a pick committed past IDLE", () => {
    const { result, rerender } = renderSelected();
    expect(result.current.value.sponsoredCommitted).toBe(false);
    expect(result.current.value.committedRentFee).toBeNull();

    mockPhase = SPONSORED_PHASE.TRANSFER;
    mockRentPayment = { asset: QUOTE.feeAsset, amount: 3_200_000n };
    mockQuoteResult = { ...mockQuoteResult, available: false, quote: null, feeCurrencyTicker: "" };
    rerender({});

    expect(result.current.value.sponsoredCommitted).toBe(true);
    expect(result.current.value.committedRentFee).toMatch(/^3\.2\sUSDT$/);
    expect(result.current.value.feeCurrencyTicker).toBe("USDT");
  });

  it("keeps the sponsored pick while signing, even if the option disappears", () => {
    const { result, rerender } = renderSelected();

    mockIsSigning = true;
    mockQuoteResult = { ...mockQuoteResult, available: false, quote: null };
    rerender({});

    expect(result.current.selected).toBe(true);
  });

  it("resets a finished send once its overlay closes", () => {
    mockPhase = SPONSORED_PHASE.DONE;
    mockIsSigning = true;
    const { rerender } = renderContext();
    expect(mockReset).not.toHaveBeenCalled();

    mockIsSigning = false;
    rerender({});

    expect(mockReset).toHaveBeenCalled();
  });

  it("starts the next send on the standard fee once a sponsored send completes", () => {
    const { result, rerender } = renderSelected();

    mockPhase = SPONSORED_PHASE.DONE;
    rerender({});
    applyUpdates();
    rerender({});

    expect(mockReset).toHaveBeenCalled();
    expect(result.current.value.available).toBe(true);
    expect(result.current.selected).toBe(false);
    expect(mockTransaction.sponsored).toBe(false);
  });

  describe("a rent that is still arriving", () => {
    it("withholds the seam from the quote, so no sponsored option is offered, and exposes rentArriving", () => {
      mockRentArriving = true;
      const { result } = renderContext();

      expect(result.current.value.rentArriving).toBe(true);
      expect(result.current.value.available).toBe(false);
      expect(mockUseSponsoredFeeQuote).toHaveBeenLastCalledWith(
        expect.objectContaining({ seam: null }),
      );
    });

    it("still gives the rest of the flow the resolved seam", () => {
      mockRentArriving = true;
      const { result } = renderContext();

      expect(result.current.value.sponsoredFeeOptionId).toBe("sponsored");
      expect(result.current.value.providerName).toBe("Provider");
      expect(mockUseSponsoredSendFunnelTracking).toHaveBeenLastCalledWith(
        expect.objectContaining({ provider: "sponsored" }),
      );
    });

    it("hands the seam to the quote again once the rent has landed", () => {
      mockRentArriving = true;
      const { result, rerender } = renderContext();

      mockRentArriving = false;
      rerender({});

      expect(result.current.value.rentArriving).toBe(false);
      expect(result.current.value.available).toBe(true);
      expect(mockUseSponsoredFeeQuote).toHaveBeenLastCalledWith(
        expect.objectContaining({ seam: SEAM }),
      );
    });

    it("moves a sponsored pick back to the standard fee when a rent starts arriving", () => {
      const { result, rerender } = renderSelected();
      expect(result.current.selected).toBe(true);

      mockRentArriving = true;
      rerender({});
      applyUpdates();

      expect(result.current.selected).toBe(false);
      expect(mockTransaction.sponsored).toBe(false);
    });
  });

  describe("a rent that has been delivered", () => {
    const renderOnAmount = () => {
      const rendered = renderContext();
      act(() => rendered.result.current.value.setAmountFocused(true));
      return rendered;
    };

    it("re-estimates once with a copy of the transaction", () => {
      const { rerender } = renderOnAmount();
      expect(mockUpdateTransaction).not.toHaveBeenCalled();

      mockRentDeliveredAt = 1_000;
      rerender({});

      expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
      const updater = mockUpdateTransaction.mock.calls[0][0] as (
        transaction: MockTransaction,
      ) => MockTransaction;
      const copy = updater(mockTransaction);
      expect(copy).toEqual(mockTransaction);
      expect(copy).not.toBe(mockTransaction);
    });

    it("does not re-estimate again on later renders of the same delivery", () => {
      mockUnmemoizedUpdateTransaction = true;
      const { rerender } = renderOnAmount();
      mockRentDeliveredAt = 1_000;
      rerender({});

      rerender({});
      rerender({});

      expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
    });

    it("re-estimates again for a later delivery", () => {
      const { rerender } = renderOnAmount();
      mockRentDeliveredAt = 1_000;
      rerender({});

      mockRentDeliveredAt = 2_000;
      rerender({});

      expect(mockUpdateTransaction).toHaveBeenCalledTimes(2);
    });

    it("should wait for the Amount screen when the delivery lands while it is not focused", () => {
      const { result, rerender } = renderOnAmount();
      act(() => result.current.value.setAmountFocused(false));

      mockRentDeliveredAt = 1_000;
      rerender({});
      expect(mockUpdateTransaction).not.toHaveBeenCalled();

      act(() => result.current.value.setAmountFocused(true));
      act(() => result.current.value.setAmountFocused(false));
      act(() => result.current.value.setAmountFocused(true));

      expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
    });

    it("should wait until signing ends when the delivery lands while signing", () => {
      mockIsSigning = true;
      const { rerender } = renderOnAmount();

      mockRentDeliveredAt = 1_000;
      rerender({});
      expect(mockUpdateTransaction).not.toHaveBeenCalled();

      mockIsSigning = false;
      rerender({});

      expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
    });
  });

  it("files the TX-A reservation on the main account through the store", () => {
    renderContext();
    const { reservePendingOperation } = (useSponsoredSendSession as jest.Mock).mock.calls[0][0];
    const op = { id: "op", hash: "txA", accountId: "tron", transactionSequenceNumber: 1 };

    reservePendingOperation("tron", op);

    const action = mockDispatch.mock.calls[0][0];
    expect(action.payload.accountId).toBe("tron");
    const updated = action.payload.updater({ id: "tron", pendingOperations: [] });
    expect(updated.pendingOperations).toEqual([op]);
  });

  describe("Max with the sponsored fee", () => {
    beforeEach(() => {
      mockTransaction = { amount: new BigNumber(0), useAllAmount: true };
    });

    it("snaps Max once to what the fee token leaves after the rent and its margin", () => {
      const { result } = renderSelected();

      expect(result.current.value.sponsoredMaxAmount).toEqual(SNAPPED_MAX);
      expect(mockTransaction).toMatchObject({ useAllAmount: false, amount: SNAPPED_MAX });
      expect(mockUpdateTransaction).not.toHaveBeenCalled();
    });

    it("restores Max on the standard option while the amount is still the snapped one", () => {
      const { result, rerender } = renderSelected();

      act(() => result.current.value.selectStandard());
      applyUpdates();
      rerender({});

      expect(mockTransaction).toMatchObject({ useAllAmount: true, sponsored: false });
      expect(mockTransaction.amount).toEqual(new BigNumber(0));
    });

    it("keeps an amount the user edited after the snap", () => {
      const { result, rerender } = renderSelected();
      mockTransaction = { ...mockTransaction, amount: new BigNumber(5_000_000) };
      rerender({});

      act(() => result.current.value.selectStandard());
      applyUpdates();

      expect(mockTransaction).toMatchObject({ useAllAmount: false, sponsored: false });
      expect(mockTransaction.amount).toEqual(new BigNumber(5_000_000));
    });

    it("leaves Max alone when nothing is left after the rent and its margin", () => {
      mockQuoteResult = {
        ...mockQuoteResult,
        feeTokenAccount: { ...feeTokenAccount, spendableBalance: new BigNumber(3_000_000) },
      };
      const { result } = renderSelected();

      expect(result.current.value.sponsoredMaxAmount?.lte(0)).toBe(true);
      expect(mockTransaction.useAllAmount).toBe(true);
    });

    it("leaves Max alone on the standard fee", () => {
      renderContext();

      expect(mockUpdateTransaction).not.toHaveBeenCalled();
    });
  });
});

describe("sponsored send funnel tracking", () => {
  it("tracks the funnel with the send flow's properties", () => {
    mockQuoteResult = {
      ...mockQuoteResult,
      standardFeeFiat: new BigNumber(170),
      sponsoredFeeFiat: new BigNumber(113),
    };
    renderContext();

    expect(mockUseSponsoredSendFunnelTracking).toHaveBeenLastCalledWith({
      state: { phase: SPONSORED_PHASE.IDLE, rentPayment: null },
      provider: "sponsored",
      quote: QUOTE,
      standardFeeFiat: new BigNumber(170),
      sponsoredFeeFiat: new BigNumber(113),
      fiatCurrency: { units: [{ name: "Euro", code: "EUR", magnitude: 2 }] },
      flowSessionId: "session-1",
      properties: { flow: "send" },
      track,
    });
  });
});
