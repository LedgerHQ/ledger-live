import { renderHook } from "@tests/test-renderer";
import { usePortfolioServicesSectionViewModel } from "./usePortfolioServicesSectionViewModel";
import { NavigatorName, ScreenName } from "~/const";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: function useNavigation() {
    return { navigate: mockNavigate };
  },
}));

describe("usePortfolioServicesSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should navigate to the Perps tab when opening perps", () => {
    const { result } = renderHook(usePortfolioServicesSectionViewModel);

    result.current.onOpenService("perps");

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Perps, {
      screen: ScreenName.PerpsTab,
    });
  });

  it("should navigate to the Borrow screen when opening borrow", () => {
    const { result } = renderHook(usePortfolioServicesSectionViewModel);

    result.current.onOpenService("borrow");

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Borrow, {
      screen: ScreenName.Borrow,
      params: {},
    });
  });
});
