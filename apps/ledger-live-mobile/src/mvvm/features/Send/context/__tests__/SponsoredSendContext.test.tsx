import React from "react";
import { act, renderHook } from "@testing-library/react-native";
import { BigNumber } from "bignumber.js";
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
let mockIsSigning: boolean;
let mockQuoteResult: Record<string, unknown>;
const mockUseSponsoredFeeQuote = jest.fn((..._args: unknown[]) => mockQuoteResult);
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
  useSendFlowActions: () => ({ transaction: { updateTransaction: mockUpdateTransaction } }),
}));
jest.mock("@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendSession", () => ({
  useSponsoredSendSession: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/flows/send/sponsored/useSponsoredFeeQuote", () => ({
  useSponsoredFeeQuote: (...args: unknown[]) => mockUseSponsoredFeeQuote(...args),
}));
jest.mock("@ledgerhq/live-common/flows/send/sponsored/feeAmounts", () => ({
  formatSponsoredFeeAmounts: (...args: unknown[]) => mockFormatSponsoredFeeAmounts(...args),
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
  mockIsSigning = false;
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
    state: { phase: mockPhase },
    actions,
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
