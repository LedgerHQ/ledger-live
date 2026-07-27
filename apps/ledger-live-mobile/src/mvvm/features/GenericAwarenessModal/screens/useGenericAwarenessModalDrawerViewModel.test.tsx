import { act, renderHook } from "@testing-library/react-native";
import { promptMockData } from "../mockData";
import { useGenericAwarenessModalDrawerViewModel } from "./useGenericAwarenessModalDrawerViewModel";

const mockDispatch = jest.fn();
const mockLogClick = jest.fn();
const mockLogDismiss = jest.fn();

jest.mock("~/context/hooks", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: () => ({ enabled: true }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));

jest.mock("./useGenericAwarenessModalLogic", () => ({
  useGenericAwarenessModalLogic: () => ({ shouldMarkAsRead: false }),
}));

jest.mock("../hooks/useGenericAwarenessModalBrazeLogging", () => ({
  useGenericAwarenessModalBrazeLogging: () => ({
    logClick: mockLogClick,
    logDismiss: mockLogDismiss,
  }),
}));

jest.mock("~/reducers/genericAwarenessModal", () => ({
  selectIsGenericAwarenessModalOpen: () => true,
  selectGenericAwarenessModalCampaignId: () => promptMockData.id,
  selectGenericAwarenessModalContentCards: () => [promptMockData],
  selectCurrentGenericAwarenessModalContentCard: () => promptMockData,
  closeGenericAwarenessModalDrawer: jest.fn(() => ({ type: "CLOSE_GENERIC_AWARENESS_MODAL" })),
  markGenericAwarenessModalContentCardAsRead: jest.fn((payload: { id: string }) => ({
    type: "MARK_GENERIC_AWARENESS_MODAL_READ",
    payload,
  })),
}));

describe("useGenericAwarenessModalDrawerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should log a Braze dismiss when the drawer is closed", () => {
    const { result } = renderHook(() => useGenericAwarenessModalDrawerViewModel());

    act(() => {
      result.current.onClose();
    });

    expect(mockLogDismiss).toHaveBeenCalledTimes(1);
    expect(mockLogClick).not.toHaveBeenCalled();
  });

  it("should not log a Braze dismiss when closing after a CTA click", () => {
    const { result } = renderHook(() => useGenericAwarenessModalDrawerViewModel());

    act(() => {
      result.current.promptViewModel?.onPrimaryPress();
      result.current.onClose({ logDismiss: false });
    });

    expect(mockLogClick).toHaveBeenCalledTimes(1);
    expect(mockLogDismiss).not.toHaveBeenCalled();
  });

  it("should not log a Braze click when the prompt close button is pressed", () => {
    const { result } = renderHook(() => useGenericAwarenessModalDrawerViewModel());

    act(() => {
      result.current.promptViewModel?.onClosePress();
      result.current.onClose();
    });

    expect(mockLogClick).not.toHaveBeenCalled();
    expect(mockLogDismiss).toHaveBeenCalledTimes(1);
  });
});
