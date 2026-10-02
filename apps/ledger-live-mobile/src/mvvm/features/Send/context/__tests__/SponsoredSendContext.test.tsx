import React from "react";
import { renderHook } from "@testing-library/react-native";
import { BigNumber } from "bignumber.js";
import {
  SPONSORED_PHASE,
  type SponsoredPhase,
} from "@ledgerhq/live-common/flows/send/sponsored/types";
import {
  STANDARD_FEE_OPTION_ID,
  SponsoredSendProvider,
  pickAutoFeeOption,
  useIsSponsoredSelected,
  useSponsoredSend,
} from "../SponsoredSendContext";

const mockUpdateTransaction = jest.fn();
const mockDispatch = jest.fn();
const mockReset = jest.fn();
let mockTransaction: { amount: BigNumber; useAllAmount: boolean; sponsored?: boolean };
let mockPhase: SponsoredPhase;
let mockIsSigning: boolean;
let mockQuoteResult: Record<string, unknown>;
const mockUseSponsoredFeeQuote = jest.fn((..._args: unknown[]) => mockQuoteResult);

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

const { useSponsoredSendSession } = jest.requireMock(
  "@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendSession",
);

const SEAM = {
  feeOptionId: "sponsored",
  providerName: "Provider",
  waivesErrorKeys: ["gasPrice"],
  waivesWarningKeys: ["amount"],
};
const QUOTE = { feeAsset: { type: "trc20" }, value: 3_200_000n, originalValue: 13_000_000n };
const feeTokenAccount = {
  id: "usdt",
  spendableBalance: new BigNumber(10_000_000),
  pendingOperations: [],
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SponsoredSendProvider>{children}</SponsoredSendProvider>
);

const renderContext = () =>
  renderHook(() => ({ value: useSponsoredSend(), selected: useIsSponsoredSelected() }), {
    wrapper,
  });

/** Applies the last `updateTransaction` updater to the current transaction. */
const lastUpdate = () => {
  const updater = mockUpdateTransaction.mock.calls.at(-1)?.[0];
  return updater ? updater(mockTransaction) : null;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockTransaction = { amount: new BigNumber(1_000_000), useAllAmount: false };
  mockPhase = SPONSORED_PHASE.IDLE;
  mockIsSigning = false;
  mockQuoteResult = {
    available: true,
    quote: QUOTE,
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

describe("pickAutoFeeOption", () => {
  const base = {
    phase: SPONSORED_PHASE.IDLE as SponsoredPhase,
    signing: false,
    sponsoredFeeOptionId: "sponsored",
    available: true,
    quoted: true,
    useAllAmount: false,
    unaffordable: false,
  };

  it.each<[string, Partial<typeof base>, string | null]>([
    ["an affordable quoted send", {}, "sponsored"],
    ["a seam without the option", { sponsoredFeeOptionId: "" }, STANDARD_FEE_OPTION_ID],
    ["an unavailable option", { available: false }, STANDARD_FEE_OPTION_ID],
    ["a max send", { useAllAmount: true }, STANDARD_FEE_OPTION_ID],
    ["a rent the fee token can't cover", { unaffordable: true }, STANDARD_FEE_OPTION_ID],
    ["a reloading quote", { quoted: false }, null],
    ["a flow past IDLE", { phase: SPONSORED_PHASE.TRANSFER, available: false }, null],
    ["a send being signed", { signing: true, available: false }, null],
  ])("picks for %s", (_label, overrides, expected) => {
    expect(pickAutoFeeOption({ ...base, ...overrides })).toBe(expected);
  });
});

describe("SponsoredSendProvider", () => {
  it("picks the sponsored fee and marks the transaction sponsored", () => {
    const { result } = renderContext();

    expect(result.current.selected).toBe(true);
    expect(result.current.value.selectedFeeOptionId).toBe("sponsored");
    expect(lastUpdate()).toMatchObject({ sponsored: true });
  });

  it("exposes the seam's identity and a sponsored pick ready for Review", () => {
    const { result } = renderContext();

    expect(result.current.value).toMatchObject({
      mainAccount: { id: "tron" },
      sponsoredFeeOptionId: "sponsored",
      providerName: "Provider",
      waivesErrorKeys: ["gasPrice"],
      waivesWarningKeys: ["amount"],
      waivesNativeFee: true,
      reviewReady: true,
      feeCurrencyTicker: "USDT",
    });
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

  it("holds Review while the sponsored pick's quote reloads, and keeps waiving meanwhile", () => {
    const { result, rerender } = renderContext();
    expect(result.current.selected).toBe(true);

    mockQuoteResult = { ...mockQuoteResult, quote: null };
    rerender({});

    expect(result.current.selected).toBe(true);
    expect(result.current.value.reviewReady).toBe(false);
    expect(result.current.value.waivesNativeFee).toBe(true);
  });

  // TX-A is paid by then, and coin-tron stops listing the option once the energy is delivered.
  it("keeps Review ready past IDLE after the option is withdrawn", () => {
    const { result, rerender } = renderContext();
    expect(result.current.selected).toBe(true);

    mockPhase = SPONSORED_PHASE.TRANSFER;
    mockQuoteResult = { ...mockQuoteResult, available: false, quote: null };
    rerender({});

    expect(result.current.selected).toBe(true);
    expect(result.current.value.reviewReady).toBe(true);
    expect(result.current.value.waivesNativeFee).toBe(true);
  });

  it("doesn't switch to the sponsored fee when the quote lands mid-signing", () => {
    mockIsSigning = true;

    const { result } = renderContext();

    expect(result.current.selected).toBe(false);
    expect(mockUpdateTransaction).not.toHaveBeenCalled();
  });

  it("keeps the sponsored pick from Review on, even if the option disappears", () => {
    const { result, rerender } = renderContext();
    expect(result.current.selected).toBe(true);

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

  it("stays on the standard fee for a max send", () => {
    mockTransaction = { amount: new BigNumber(0), useAllAmount: true };

    const { result } = renderContext();

    expect(result.current.selected).toBe(false);
    expect(mockUpdateTransaction).not.toHaveBeenCalled();
  });

  it("stays on the standard fee when the fee token can't cover the amount and the rent", () => {
    mockTransaction = { amount: new BigNumber(9_000_000), useAllAmount: false };

    const { result } = renderContext();

    expect(result.current.selected).toBe(false);
  });

  it("reverts to the standard fee when the option disappears", () => {
    const { result, rerender } = renderContext();
    expect(result.current.selected).toBe(true);

    mockQuoteResult = { ...mockQuoteResult, available: false, quote: null };
    rerender({});

    expect(result.current.selected).toBe(false);
    expect(lastUpdate()).toMatchObject({ sponsored: false });
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
});
