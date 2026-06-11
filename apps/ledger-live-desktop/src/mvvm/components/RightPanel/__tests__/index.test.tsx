import React from "react";
import { render, screen } from "tests/testSetup";
import RightPanel from "../index";
import { DEFAULT_RIGHT_PANEL_VIEW_MODEL } from "../useRightPanelViewModel";

const mockUseRightPanelViewModel = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useLocation: jest.fn(() => ({ pathname: "/", search: "", hash: "", state: null })),
}));

jest.mock("../useRightPanelViewModel", () => ({
  ...jest.requireActual("../useRightPanelViewModel"),
  useRightPanelViewModel: (...args: unknown[]) => mockUseRightPanelViewModel(...args),
}));

jest.mock("~/renderer/screens/dashboard/components/SwapWebViewEmbedded", () => ({
  __esModule: true,
  default: ({ initialSwapState }: { initialSwapState?: { defaultAccountId?: string } }) => (
    <div
      data-testid="swap-webview-embedded"
      data-default-account-id={initialSwapState?.defaultAccountId}
    />
  ),
}));

const { useLocation } = jest.requireMock("react-router");

describe("RightPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocation.mockReturnValue({ pathname: "/", search: "", hash: "", state: null });
  });

  it("renders the default view model on non-asset routes without calling the hook", () => {
    render(<RightPanel />);

    expect(mockUseRightPanelViewModel).not.toHaveBeenCalled();
    expect(screen.getByTestId("swap-webview-embedded")).toBeVisible();
    expect(screen.getByTestId("swap-webview-embedded")).not.toHaveAttribute(
      "data-default-account-id",
    );
  });

  it("calls the view model hook on asset routes", () => {
    useLocation.mockReturnValue({
      pathname: "/asset/bitcoin",
      search: "",
      hash: "",
      state: null,
    });
    mockUseRightPanelViewModel.mockReturnValue({
      webviewKey: "bitcoin::account-1",
      initialSwapState: {
        defaultAmountFrom: "0",
        from: "/asset/bitcoin",
        defaultCurrency: { toCurrencyId: "bitcoin" },
        defaultAccountId: "account-1",
      },
    });

    render(<RightPanel />);

    expect(mockUseRightPanelViewModel).toHaveBeenCalledWith({
      pathname: "/asset/bitcoin",
      routeAssetId: "bitcoin",
    });

    const swapWebview = screen.getByTestId("swap-webview-embedded");
    expect(swapWebview).toBeVisible();
    expect(swapWebview).toHaveAttribute("data-default-account-id", "account-1");
  });

  it("uses the default view model constants on portfolio routes", () => {
    render(<RightPanel />);

    expect(DEFAULT_RIGHT_PANEL_VIEW_MODEL.initialSwapState).toBeUndefined();
    expect(DEFAULT_RIGHT_PANEL_VIEW_MODEL.webviewKey).toBe("none::none");
  });
});
