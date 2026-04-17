import { Linking } from "react-native";
import { act, renderHook } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import { urls } from "~/utils/urls";
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

  it("should return three actions", () => {
    const { result } = renderHook(() => useQuickActionsRowViewModel());
    expect(result.current.actions).toHaveLength(3);
    expect(result.current.actions.map(a => a.id)).toEqual(["recover", "help", "referral"]);
  });

  describe("referral action", () => {
    it("should open the referral URL and track event on press", () => {
      const { result } = renderHook(() => useQuickActionsRowViewModel());
      const referralAction = result.current.actions.find(a => a.id === "referral")!;

      act(() => referralAction.onPress());

      expect(Linking.openURL).toHaveBeenCalledWith(urls.referralProgram);
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Referral",
        page: ScreenName.MyWallet,
      });
    });
  });
});
