import { track } from "@shared/analytics";
import { Linking } from "react-native";
import { act, renderHook } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import { MY_WALLET_TRACKING_PAGE_NAME } from "../../../constants";
import { useQuickActionsRowViewModel } from "../useQuickActionsRowViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe("useQuickActionsRowViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the help and referral actions", () => {
    const { result } = renderHook(() => useQuickActionsRowViewModel());
    expect(result.current.actions.map(a => a.id)).toEqual(["help", "referral"]);
  });

  describe("help action", () => {
    it("should navigate to MyWalletHelp screen and track event on press", () => {
      const { result } = renderHook(() => useQuickActionsRowViewModel());
      const helpAction = result.current.actions.find(a => a.id === "help")!;

      act(() => helpAction.onPress());

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.MyWallet, {
        screen: ScreenName.MyWalletHelp,
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Help",
        page: MY_WALLET_TRACKING_PAGE_NAME,
      });
    });
  });

  describe("referral action", () => {
    it("should open the referral URL and track event on press", () => {
      const { result } = renderHook(() => useQuickActionsRowViewModel());
      const referralAction = result.current.actions.find(a => a.id === "referral")!;

      act(() => referralAction.onPress());

      expect(Linking.openURL).toHaveBeenCalledWith(urls.referralProgram);
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Referral",
        page: MY_WALLET_TRACKING_PAGE_NAME,
      });
    });
  });
});
