import React, { type ReactNode } from "react";
import { act, renderHook } from "tests/testSetup";
import { SponsoredSendProvider, useSponsoredSend } from "../SponsoredSendContext";

const mockAccount = { id: "acc_tron", type: "Account", currency: { id: "tron" } };
const mockTransaction = { family: "tron", amount: {} };

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
  savingsFiat: null,
  feeCurrencyTicker: "TRX",
  loading: false,
};
const mockUseSponsoredFee = jest.fn((..._args: unknown[]) => mockUseSponsoredFeeResult);
jest.mock("../../hooks/useSponsoredFee", () => ({
  useSponsoredFee: (...args: unknown[]) => mockUseSponsoredFee(...args),
}));

jest.mock("../SendFlowContext", () => ({
  useSendFlowData: jest.fn(() => ({
    state: {
      account: { account: mockAccount, parentAccount: null },
      transaction: { transaction: mockTransaction },
    },
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
    const { result } = renderHook(() => useSponsoredSend(), { wrapper });

    await act(async () => {
      result.current.selectTronify();
    });
    expect(result.current.selectedFeeOptionId).toBe("tronify");

    await act(async () => {
      result.current.selectStandard();
    });
    expect(result.current.selectedFeeOptionId).toBe("standard");
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
