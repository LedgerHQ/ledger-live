import React from "react";
import { render, screen } from "@tests/test-renderer";
import { SwapLiveAppWallet40 } from "../SwapLiveAppWallet40";

const mockRetry = jest.fn();
const mockResetHeader = jest.fn();

const mockHookState = {
  manifest: { id: "swap-live-app-demo-3", url: "https://swap.example.com" },
  error: null as Error | null,
  isLoading: false,
  webviewRef: { current: null },
  webviewState: {
    url: "",
    canGoBack: false,
    canGoForward: false,
    title: "",
    loading: false,
    isAppUnavailable: false,
  },
  setWebviewState: jest.fn(),
  defaultParams: null,
  retry: mockRetry,
};

jest.mock("../hooks/useSwapLiveAppState", () => ({
  useSwapLiveAppState: () => mockHookState,
}));

jest.mock("../navigationHandlers/wallet40/useSwapWallet40HeaderState", () => ({
  useSwapWallet40HeaderStateUpdater: () => jest.fn(),
  resetSwapWallet40HeaderState: () => mockResetHeader(),
}));

jest.mock("../navigationHandlers/useSwapAndroidHardwareBackPress", () => ({
  useSwapAndroidHardwareBackPress: jest.fn(),
}));

jest.mock("../hooks/useSwapWebviewProps", () => ({
  useSwapWebviewProps: () => ({ customHandlers: {}, inputs: {} }),
}));

jest.mock("~/components/Web3AppWebview", () => ({
  Web3AppWebview: () => null,
}));

jest.mock("LLM/components/LiveAppBackground", () => ({
  LiveAppBackground: () => null,
}));

// route/navigation props are unused by the error branch under test
const screenProps = {
  route: { params: {} },
} as unknown as React.ComponentProps<typeof SwapLiveAppWallet40>;

const renderScreen = () => render(<SwapLiveAppWallet40 {...screenProps} />);

describe("SwapLiveAppWallet40", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHookState.error = null;
  });

  it("shows the retry button when there is an error", () => {
    mockHookState.error = new Error("boom");

    renderScreen();

    expect(screen.getByText("Try again")).toBeVisible();
  });

  it("resets the Wallet 4.0 header store and triggers retry when 'Try again' is pressed", async () => {
    mockHookState.error = new Error("boom");

    const { user } = renderScreen();
    await user.press(screen.getByText("Try again"));

    // Header store must be reset alongside the retry so a stale route
    // (e.g. /unknown-error with canGoBack=true) doesn't leak into the header/tab bar.
    expect(mockResetHeader).toHaveBeenCalledTimes(1);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it("does not show the retry button when there is no error", () => {
    renderScreen();

    expect(screen.queryByText("Try again")).toBeNull();
  });
});
