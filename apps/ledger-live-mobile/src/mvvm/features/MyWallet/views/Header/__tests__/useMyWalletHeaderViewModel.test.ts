import { act } from "@testing-library/react-native";
import { renderHook } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { MY_WALLET_TRACKING_PAGE_NAME } from "../../../constants";
import { useMyWalletHeaderViewModel } from "../useMyWalletHeaderViewModel";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

let mockNotificationCards: { id: string; viewed: boolean }[] = [];

jest.mock("~/dynamicContent/useDynamicContent", () => ({
  __esModule: true,
  default: () => ({ notificationCards: mockNotificationCards }),
}));

describe("useMyWalletHeaderViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationCards = [];
  });

  it("should call navigation.goBack on back press", () => {
    const { result } = renderHook(() => useMyWalletHeaderViewModel());
    act(() => result.current.onBackPress());
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("should navigate to NotificationCenter and track event on notifications press", () => {
    const { result } = renderHook(() => useMyWalletHeaderViewModel());
    act(() => result.current.onNotificationsPress());
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.NotificationCenter, {
      screen: ScreenName.NotificationCenter,
    });
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Notifications",
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
  });

  it("should navigate to Settings and track event on settings press", () => {
    const { result } = renderHook(() => useMyWalletHeaderViewModel());
    act(() => result.current.onSettingsPress());
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Settings);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Settings",
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
  });

  describe("hasUnreadNotifications", () => {
    it("should return false when no notifications or all are viewed", () => {
      const { result: emptyResult } = renderHook(() => useMyWalletHeaderViewModel());
      expect(emptyResult.current.hasUnreadNotifications).toBe(false);

      mockNotificationCards = [
        { id: "1", viewed: true },
        { id: "2", viewed: true },
      ];
      const { result: allViewedResult } = renderHook(() => useMyWalletHeaderViewModel());
      expect(allViewedResult.current.hasUnreadNotifications).toBe(false);
    });

    it("should return true when at least one notification is unread", () => {
      mockNotificationCards = [
        { id: "1", viewed: true },
        { id: "2", viewed: false },
      ];
      const { result } = renderHook(() => useMyWalletHeaderViewModel());
      expect(result.current.hasUnreadNotifications).toBe(true);
    });
  });
});
