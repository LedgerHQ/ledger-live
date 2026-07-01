import { renderHook } from "@tests/test-renderer";
import { usePortfolioBorrowSectionViewModel } from "../usePortfolioBorrowSectionViewModel";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe("usePortfolioBorrowSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should navigate to Borrow screen on press", () => {
    const { result } = renderHook(() => usePortfolioBorrowSectionViewModel());

    result.current.onPress();

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Borrow, {
      screen: ScreenName.Borrow,
      params: {},
    });
  });

  it("should track borrow entry point click on press", () => {
    const { result } = renderHook(() => usePortfolioBorrowSectionViewModel());

    result.current.onPress();

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "borrow_entry_point",
      flow: "borrow",
      page: ScreenName.Portfolio,
    });
  });
});
