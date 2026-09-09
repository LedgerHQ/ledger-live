import { renderHook, act } from "tests/testSetup";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { useAmountScreen } from "../useAmountScreen";

const mockGoToStep = jest.fn();
jest.mock("LLD/features/FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: () => ({ navigation: { goToStep: mockGoToStep } }),
}));

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: () => ({
    state: {
      account: { account: null, parentAccount: null },
      transaction: { transaction: null, status: null },
    },
    uiConfig: null,
  }),
  useSendFlowActions: () => ({
    transaction: {},
    close: jest.fn(),
  }),
}));

jest.mock("../../../../context/SendFlowTrackingContext", () => ({
  useSendFlowTracking: () => ({ recipientType: null }),
}));

let mockSponsoredSend: { selectedFeeOptionId: "standard" | "tronify"; available: boolean };
jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => mockSponsoredSend,
}));

describe("useAmountScreen onReview routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("goes to SIGNATURE when the standard fee option is selected", () => {
    mockSponsoredSend = { selectedFeeOptionId: "standard", available: true };

    const { result } = renderHook(() => useAmountScreen());
    act(() => {
      result.current.onReview();
    });

    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.SIGNATURE);
  });

  it("goes to SPONSORED_RENT_SIGNATURE when tronify is selected and available", () => {
    mockSponsoredSend = { selectedFeeOptionId: "tronify", available: true };

    const { result } = renderHook(() => useAmountScreen());
    act(() => {
      result.current.onReview();
    });

    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.SPONSORED_RENT_SIGNATURE);
  });

  it("falls back to SIGNATURE when tronify is selected but unavailable", () => {
    mockSponsoredSend = { selectedFeeOptionId: "tronify", available: false };

    const { result } = renderHook(() => useAmountScreen());
    act(() => {
      result.current.onReview();
    });

    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.SIGNATURE);
  });
});
