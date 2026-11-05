import { act, renderHook } from "tests/testSetup";
import { usePortfolioServicesEntryPointsViewModel } from "../usePortfolioServicesEntryPointsViewModel";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/portfolio" }),
}));

describe("usePortfolioServicesEntryPointsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should navigate to /perps when opening perps", () => {
    const { result } = renderHook(() => usePortfolioServicesEntryPointsViewModel());

    act(() => {
      result.current.onOpenService("perps");
    });

    expect(mockNavigate).toHaveBeenCalledWith("/perps");
  });

  it("should navigate to /borrow with the current pathname as returnTo when opening borrow", () => {
    const { result } = renderHook(() => usePortfolioServicesEntryPointsViewModel());

    act(() => {
      result.current.onOpenService("borrow");
    });

    expect(mockNavigate).toHaveBeenCalledWith("/borrow", { state: { returnTo: "/portfolio" } });
  });

  it("should navigate to /predictions with the current pathname as returnTo when opening predictions", () => {
    const { result } = renderHook(() => usePortfolioServicesEntryPointsViewModel());

    act(() => {
      result.current.onOpenService("predictions");
    });

    expect(mockNavigate).toHaveBeenCalledWith("/predictions", {
      state: { returnTo: "/portfolio" },
    });
  });
});
