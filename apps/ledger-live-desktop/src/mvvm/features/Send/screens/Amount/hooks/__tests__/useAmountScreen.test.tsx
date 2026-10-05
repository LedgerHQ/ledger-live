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

const SPONSORED_ID = "sponsored-fixture";

let mockSponsoredSend: {
  selectedFeeOptionId: string;
  sponsoredFeeOptionId: string;
  available: boolean;
  intentReady: boolean;
};
jest.mock("../../../../context/SponsoredSendContext", () => ({
  STANDARD_FEE_OPTION_ID: "standard",
  useSponsoredSend: () => mockSponsoredSend,
}));

describe("useAmountScreen onReview routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("goes to SIGNATURE when the standard fee option is selected", () => {
    mockSponsoredSend = {
      selectedFeeOptionId: "standard",
      sponsoredFeeOptionId: SPONSORED_ID,
      available: true,
      intentReady: true,
    };

    const { result } = renderHook(() => useAmountScreen());
    act(() => {
      result.current.onReview();
    });

    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.SIGNATURE);
  });

  it("goes to SPONSORED_RENT_SIGNATURE when the sponsored option is selected and available", () => {
    mockSponsoredSend = {
      selectedFeeOptionId: SPONSORED_ID,
      sponsoredFeeOptionId: SPONSORED_ID,
      available: true,
      intentReady: true,
    };

    const { result } = renderHook(() => useAmountScreen());
    act(() => {
      result.current.onReview();
    });

    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.SPONSORED_RENT_SIGNATURE);
  });

  // The transaction is still marked sponsored until the provider reverts the pick to standard.
  it("does not navigate while the selected sponsored option is unavailable", () => {
    mockSponsoredSend = {
      selectedFeeOptionId: SPONSORED_ID,
      sponsoredFeeOptionId: SPONSORED_ID,
      available: false,
      intentReady: true,
    };

    const { result } = renderHook(() => useAmountScreen());
    act(() => {
      result.current.onReview();
    });

    expect(mockGoToStep).not.toHaveBeenCalled();
  });

  it("does not navigate while a sponsored pick outlives its seam", () => {
    mockSponsoredSend = {
      selectedFeeOptionId: SPONSORED_ID,
      sponsoredFeeOptionId: "",
      available: false,
      intentReady: false,
    };

    const { result } = renderHook(() => useAmountScreen());
    act(() => {
      result.current.onReview();
    });

    expect(mockGoToStep).not.toHaveBeenCalled();
  });

  it("does not navigate when the sponsored option is available but the intent is not yet rebuilt", () => {
    mockSponsoredSend = {
      selectedFeeOptionId: SPONSORED_ID,
      sponsoredFeeOptionId: SPONSORED_ID,
      available: true,
      intentReady: false,
    };

    const { result } = renderHook(() => useAmountScreen());
    act(() => {
      result.current.onReview();
    });

    expect(mockGoToStep).not.toHaveBeenCalled();
  });
});
