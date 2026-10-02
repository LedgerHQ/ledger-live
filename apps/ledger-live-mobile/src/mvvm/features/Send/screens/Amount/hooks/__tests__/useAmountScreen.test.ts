import { act, renderHook } from "@testing-library/react-native";
import { track } from "@shared/analytics";
import { useAmountScreen } from "../useAmountScreen";

const mockStartSigning = jest.fn();
let mockReviewReady: boolean;

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock("@shared/analytics", () => ({
  trackPage: jest.fn(),
  track: jest.fn(),
}));
jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: () => ({
    state: { account: {}, transaction: {} },
    uiConfig: null,
    source: undefined,
  }),
  useSendFlowActions: () => ({ transaction: null, close: jest.fn() }),
}));
jest.mock("../../../../context/SendSignatureContext", () => ({
  useSendSignature: () => ({ startSigning: mockStartSigning }),
}));
jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => ({ reviewReady: mockReviewReady }),
}));
jest.mock("../../../../context/SendFlowTrackingContext", () => ({
  useSendFlowTracking: () => ({ recipientType: "address" }),
}));
jest.mock("../../../../hooks/useSendFlowTrackingProperties", () => ({
  useSendFlowTrackingProperties: () => ({}),
}));
jest.mock("@ledgerhq/live-common/flows/send/amount/SendAmountDisplayModeContext", () => ({
  useSendAmountDisplayMode: () => ({ displayMode: "crypto" }),
}));

describe("useAmountScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("starts signing on Review", () => {
    mockReviewReady = true;
    const { result } = renderHook(() => useAmountScreen());

    act(() => result.current.onReview());

    expect(mockStartSigning).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "review" }),
    );
  });

  it("ignores Review, untracked, until the sponsored pick is ready", () => {
    mockReviewReady = false;
    const { result } = renderHook(() => useAmountScreen());

    act(() => result.current.onReview());

    expect(mockStartSigning).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });
});
