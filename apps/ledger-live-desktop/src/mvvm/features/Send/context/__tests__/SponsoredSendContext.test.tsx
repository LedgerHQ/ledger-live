import React, { type ReactNode } from "react";
import BigNumber from "bignumber.js";
import { act, renderHook } from "tests/testSetup";
import { SponsoredSendProvider, useSponsoredSend } from "../SponsoredSendContext";

const mockAccount = { id: "acc_tron", type: "Account", currency: { id: "tron" } };
// Reassignable so a test can change the transaction identity between renders (the
// orchestration reset keys on it); reset to a fresh baseline in beforeEach.
let mockTransaction: Record<string, unknown> = { family: "tron", amount: {} };

const mockSponsoredState = {
  phase: "IDLE",
  order: null,
  paymentTxId: null,
  failureKind: null,
  failureError: null,
};
const mockActions = {
  craftRent: jest.fn(),
  startRentPayment: jest.fn(),
  onTransferSuccess: jest.fn(),
  setContractDataFailure: jest.fn(),
  onTransferError: jest.fn(),
  retry: jest.fn(),
  reset: jest.fn(),
};

const mockUseSponsoredSendOrchestration = jest.fn((..._args: unknown[]) => ({
  state: mockSponsoredState,
  actions: mockActions,
}));

jest.mock("@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendOrchestration", () => ({
  useSponsoredSendOrchestration: (...args: unknown[]) => mockUseSponsoredSendOrchestration(...args),
}));

jest.mock("@ledgerhq/live-common/bridge/generic-coin-framework/buildIntent", () => ({
  buildGenericTransactionIntent: jest.fn(() => Promise.resolve({ fake: "intent" })),
}));

const mockGetSponsoredCoinApi = jest.fn((..._args: unknown[]) => Promise.resolve({} as unknown));
jest.mock("@ledgerhq/live-common/bridge/generic-coin-framework/sponsored", () => ({
  getSponsoredCoinApi: (...args: unknown[]) => mockGetSponsoredCoinApi(...args),
}));

const mockUseFeature = jest.fn((..._args: unknown[]) => ({ enabled: true }));
jest.mock("@features/platform-feature-flags", () => ({
  useFeature: (...args: unknown[]) => mockUseFeature(...args),
}));

const mockUseSponsoredFeeResult = {
  available: false,
  quote: null,
  savingsFiat: null as BigNumber | null,
  feeCurrencyTicker: "TRX",
  loading: false,
};
const mockUseSponsoredFee = jest.fn((..._args: unknown[]) => mockUseSponsoredFeeResult);
jest.mock("../../hooks/useSponsoredFee", () => ({
  useSponsoredFee: (...args: unknown[]) => mockUseSponsoredFee(...args),
}));

const mockUpdateTransaction = jest.fn();
jest.mock("../SendFlowContext", () => ({
  useSendFlowData: jest.fn(() => ({
    state: {
      account: { account: mockAccount, parentAccount: null },
      transaction: { transaction: mockTransaction },
    },
  })),
  useSendFlowActions: jest.fn(() => ({
    transaction: { updateTransaction: mockUpdateTransaction },
  })),
}));

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <SponsoredSendProvider>{children}</SponsoredSendProvider>;
}

describe("SponsoredSendContext", () => {
  beforeEach(() => {
    mockUseSponsoredSendOrchestration.mockClear();
    mockGetSponsoredCoinApi.mockClear();
    mockUseFeature.mockClear();
    mockUseSponsoredFee.mockClear();
    mockUpdateTransaction.mockClear();
    mockActions.reset.mockClear();
    mockUseSponsoredFeeResult.available = false;
    mockUseSponsoredFeeResult.savingsFiat = null;
    mockTransaction = { family: "tron", amount: {} };
  });

  it("exposes useSponsoredFee's result (available/quote/savingsFiatFormatted/feeLoading)", () => {
    const { result } = renderHook(() => useSponsoredSend(), { wrapper });

    expect(result.current.available).toBe(false);
    expect(result.current.quote).toBeNull();
    expect(result.current.savingsFiatFormatted).toBeNull();
    expect(result.current.feeLoading).toBe(false);
    expect(mockUseSponsoredFee).toHaveBeenCalledWith(
      expect.objectContaining({ account: mockAccount }),
    );
  });

  it("defaults selectedFeeOptionId to standard and passes the orchestration state through", () => {
    const { result } = renderHook(() => useSponsoredSend(), { wrapper });

    expect(result.current.selectedFeeOptionId).toBe("standard");
    expect(result.current.state).toBe(mockSponsoredState);
  });

  it("drives the orchestration with the TRON network and the local seam kind", () => {
    renderHook(() => useSponsoredSend(), { wrapper });

    expect(mockUseSponsoredSendOrchestration).toHaveBeenCalledWith(
      expect.objectContaining({ network: "tron", kind: "local" }),
    );
  });

  it("selectTronify/selectStandard toggle selectedFeeOptionId", async () => {
    // Tronify is only selectable while it is available; without this the availability-revert
    // effect would immediately roll the selection back to standard.
    mockUseSponsoredFeeResult.available = true;
    const { result } = renderHook(() => useSponsoredSend(), { wrapper });

    await act(async () => {
      result.current.selectTronify();
    });
    expect(result.current.selectedFeeOptionId).toBe("tronify");
    // Marks the transaction sponsored so the optimistic op skips the standard native fee-lock.
    expect(mockUpdateTransaction).toHaveBeenLastCalledWith(expect.any(Function));
    expect(mockUpdateTransaction.mock.calls.at(-1)![0]({})).toEqual({ sponsored: true });

    await act(async () => {
      result.current.selectStandard();
    });
    expect(result.current.selectedFeeOptionId).toBe("standard");
    expect(mockUpdateTransaction.mock.calls.at(-1)![0]({})).toEqual({ sponsored: false });
  });

  it("reverts to standard and clears the sponsored marker when availability is lost (fix A)", async () => {
    mockUseSponsoredFeeResult.available = true;
    const { result, rerender } = renderHook(() => useSponsoredSend(), { wrapper });

    await act(async () => {
      result.current.selectTronify();
    });
    expect(result.current.selectedFeeOptionId).toBe("tronify");

    // Availability drops after selection; the effect must roll the selection back and unmark
    // the transaction so the standard fee lock is restored.
    mockUseSponsoredFeeResult.available = false;
    await act(async () => {
      rerender();
    });

    expect(result.current.selectedFeeOptionId).toBe("standard");
    expect(mockUpdateTransaction.mock.calls.at(-1)![0]({})).toEqual({ sponsored: false });
  });

  it("resets the orchestration when the transaction identity changes (fix B)", async () => {
    const { rerender } = renderHook(() => useSponsoredSend(), { wrapper });
    // Ignore the mount-time reset; assert only the identity-change reset.
    mockActions.reset.mockClear();

    mockTransaction = { family: "tron", amount: {}, recipient: "TNewRecipient" };
    await act(async () => {
      rerender();
    });

    expect(mockActions.reset).toHaveBeenCalledTimes(1);
  });

  it("resets the orchestration when useAllAmount toggles (max-send changes the intent though amount stays 0)", async () => {
    mockTransaction = { family: "tron", amount: {}, useAllAmount: false };
    const { rerender } = renderHook(() => useSponsoredSend(), { wrapper });
    mockActions.reset.mockClear();

    mockTransaction = { family: "tron", amount: {}, useAllAmount: true };
    await act(async () => {
      rerender();
    });

    expect(mockActions.reset).toHaveBeenCalledTimes(1);
  });

  it("suppresses savingsFiatFormatted when savings is zero (Tronify not cheaper)", () => {
    mockUseSponsoredFeeResult.savingsFiat = new BigNumber(0);
    const { result } = renderHook(() => useSponsoredSend(), { wrapper });

    expect(result.current.savingsFiatFormatted).toBeNull();

    mockUseSponsoredFeeResult.savingsFiat = null;
  });

  it("passes the orchestration's actions object through unchanged", () => {
    const { result } = renderHook(() => useSponsoredSend(), { wrapper });

    expect(result.current.actions).toBe(mockActions);
  });

  it("stays crash-free when seam resolution rejects (no unhandled rejection from the intent effect)", async () => {
    mockGetSponsoredCoinApi.mockRejectedValueOnce(new Error("coin-module load failed"));

    const { result } = renderHook(() => useSponsoredSend(), { wrapper });
    // Flush the intent effect's rejected getSponsoredCoinApi promise.
    await act(async () => {});

    // The intent effect swallows the rejection to a null intent; the provider still renders and
    // exposes a usable context rather than throwing.
    expect(result.current.state).toBe(mockSponsoredState);
    expect(result.current.actions).toBe(mockActions);
  });
});
