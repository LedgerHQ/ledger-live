import React from "react";
import type { RefObject } from "react";
import { render, screen } from "@tests/test-renderer";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import type { PerpsWebviewInputs } from "../usePerpsLiveAppViewModel";
import { PerpsLiveAppView } from "../index";

jest.mock("LLM/features/Perps/components/PerpsWebView", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    PerpsWebView: React.forwardRef(function MockPerpsWebView(
      _props: Record<string, unknown>,
      _ref: React.Ref<unknown>,
    ) {
      return <Text testID="perps-webview">Perps WebView</Text>;
    }),
  };
});

const mockManifest = {
  id: "perps",
  url: "https://perps.example.com",
} as unknown as LiveAppManifest;

const defaultInputs: PerpsWebviewInputs = {
  source: "",
  devMode: "false",
  theme: "dark",
  lang: "en",
  locale: "en",
  countryLocale: "US",
  currencyTicker: "USD",
  OS: "ios",
  platform: "LLM",
  shareAnalytics: "false",
  hasSeenAnalyticsOptInPrompt: "false",
};

const defaultProps = {
  manifest: mockManifest,
  error: null as Error | null,
  isLoading: false,
  webviewRef: { current: null } as RefObject<WebviewAPI | null>,
  onWebviewStateChange: jest.fn() as (state: WebviewState) => void,
  webviewInputs: defaultInputs,
  accounts: [],
};

describe("PerpsLiveAppView", () => {
  it("should render the perps webview when the manifest is available", () => {
    render(<PerpsLiveAppView {...defaultProps} />);

    expect(screen.getByTestId("perps-tab")).toBeOnTheScreen();
    expect(screen.getByTestId("perps-webview")).toBeOnTheScreen();
  });

  it("should render an empty perps screen when the manifest is undefined", () => {
    render(<PerpsLiveAppView {...defaultProps} manifest={undefined} />);

    expect(screen.getByTestId("perps-tab")).toBeOnTheScreen();
    expect(screen.queryByTestId("perps-webview")).toBeNull();
  });

  it("should render the error view when there is an error and it is not loading", () => {
    render(<PerpsLiveAppView {...defaultProps} error={new Error("Network error")} />);

    expect(screen.queryByTestId("perps-tab")).toBeNull();
    expect(screen.queryByTestId("perps-webview")).toBeNull();
  });

  it("should render the loader when there is an error and it is loading", () => {
    render(<PerpsLiveAppView {...defaultProps} error={new Error("Loading")} isLoading />);

    expect(screen.queryByTestId("perps-tab")).toBeNull();
    expect(screen.queryByTestId("perps-webview")).toBeNull();
  });
});
