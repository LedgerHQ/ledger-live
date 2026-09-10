import { renderHook } from "tests/testSetup";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { useSponsoredFailureViewModel } from "../useSponsoredFailureViewModel";

const mockGoToStep = jest.fn();
jest.mock("LLD/features/FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: () => ({ navigation: { goToStep: mockGoToStep } }),
}));

const mockClose = jest.fn();
jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowActions: () => ({ close: mockClose }),
}));

const mockRetry = jest.fn();
let mockSponsoredState: { phase: string; failureKind: string | null; paymentTxId: string | null };

jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => ({ state: mockSponsoredState, actions: { retry: mockRetry } }),
}));

describe("useSponsoredFailureViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSponsoredState = { phase: "FAILED", failureKind: "RENT_PAYMENT", paymentTxId: null };
  });

  it("renders the RENT_PAYMENT message", () => {
    mockSponsoredState = { phase: "FAILED", failureKind: "RENT_PAYMENT", paymentTxId: null };
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.message).toBe("Fee payment failed — your funds were not moved.");
  });

  it("renders the DELIVERY_FAILED message with the paymentTxId interpolated", () => {
    mockSponsoredState = {
      phase: "FAILED",
      failureKind: "DELIVERY_FAILED",
      paymentTxId: "0xabc123",
    };
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.message).toBe(
      "Energy was not delivered. Your rental fee payment was sent — contact Tronify support for a refund (0xabc123).",
    );
  });

  it("omits the txid parenthetical entirely when paymentTxId is null", () => {
    mockSponsoredState = { phase: "FAILED", failureKind: "DELIVERY_FAILED", paymentTxId: null };
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.message).not.toContain("null");
    // No empty "()" when there is no txid to show.
    expect(result.current.message).not.toContain("()");
    expect(result.current.message).toBe(
      "Energy was not delivered. Your rental fee payment was sent — contact Tronify support for a refund.",
    );
  });

  it("warns that retrying DELIVERY_FAILED costs a second rental fee", () => {
    mockSponsoredState = { phase: "FAILED", failureKind: "DELIVERY_FAILED", paymentTxId: null };
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.retryLabel).toBe("Pay again and retry");
  });

  it.each(["RENT_PAYMENT", "CONTRACT_DATA", "TRANSFER"])(
    "keeps the plain retry label for %s, where retrying costs nothing extra",
    failureKind => {
      mockSponsoredState = { phase: "FAILED", failureKind, paymentTxId: null };
      const { result } = renderHook(() => useSponsoredFailureViewModel());

      expect(result.current.retryLabel).toBe("Retry");
    },
  );

  it("renders the CONTRACT_DATA message", () => {
    mockSponsoredState = { phase: "FAILED", failureKind: "CONTRACT_DATA", paymentTxId: null };
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    expect(result.current.message).toBe(
      "Contract data is disabled on your TRON app. Enable TRON app → Settings → Contract data, then retry.",
    );
  });

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

  it("calls actions.retry() on retry", () => {
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    result.current.onRetry();

    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it("calls close() on cancel", () => {
    const { result } = renderHook(() => useSponsoredFailureViewModel());

    result.current.onCancel();

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it("navigates to SPONSORED_RENT_SIGNATURE when the phase transitions to RENT_SIGNING", () => {
    const { rerender } = renderHook(() => useSponsoredFailureViewModel());

    mockSponsoredState = { phase: "RENT_SIGNING", failureKind: null, paymentTxId: null };
    rerender();

    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.SPONSORED_RENT_SIGNATURE);
  });

  it("navigates to SIGNATURE when the phase transitions to TRANSFER", () => {
    const { rerender } = renderHook(() => useSponsoredFailureViewModel());

    mockSponsoredState = { phase: "TRANSFER", failureKind: null, paymentTxId: null };
    rerender();

    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.SIGNATURE);
  });

  it("does not navigate while phase stays FAILED", () => {
    const { rerender } = renderHook(() => useSponsoredFailureViewModel());

    mockSponsoredState = { phase: "FAILED", failureKind: "TRANSFER", paymentTxId: null };
    rerender();

    expect(mockGoToStep).not.toHaveBeenCalled();
  });

  it("does not re-dispatch navigation on a same-phase re-render", () => {
    const { rerender } = renderHook(() => useSponsoredFailureViewModel());

    mockSponsoredState = { phase: "TRANSFER", failureKind: null, paymentTxId: null };
    rerender();
    rerender();

    expect(mockGoToStep).toHaveBeenCalledTimes(1);
  });
});
