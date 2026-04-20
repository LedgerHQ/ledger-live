import React from "react";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { render, screen } from "tests/testSetup";
import { useDeeplinkCustomHandlers } from "~/renderer/components/WebPlatformPlayer/CustomHandlers";
import { BorrowWebView } from "../BorrowWebView";
import type { BorrowWebviewInputs } from "../../BorrowApp/useBorrowAppViewModel";

jest.mock("~/renderer/components/WebPlatformPlayer/TopBar", () => ({
  TopBar: () => <div data-testid="borrow-top-bar" />,
}));

jest.mock("~/renderer/components/Web3AppWebview", () => ({
  Web3AppWebview: ({ onStateChange }: { onStateChange: (state: unknown) => void }) => {
    onStateChange({
      url: "https://borrow.example",
      canGoBack: false,
      canGoForward: false,
      title: "Borrow",
      loading: false,
    });
    return <div data-testid="borrow-web3app-webview" />;
  },
}));

jest.mock("~/renderer/components/WebPlatformPlayer/CustomHandlers", () => ({
  useDeeplinkCustomHandlers: jest.fn().mockReturnValue({}),
}));

const manifest = { id: "borrow", url: "https://borrow.example" } as LiveAppManifest;
const inputs = {
  devMode: "false",
  theme: "dark",
  lang: "en",
  locale: "en-US",
  countryLocale: "US",
  currencyTicker: "USD",
  OS: "web",
  platform: "LLD",
  discreetMode: "false",
} as BorrowWebviewInputs;

const defaultProps = {
  manifest,
  inputs,
  webviewAPIRef: { current: null },
  webviewState: {
    url: "",
    canGoBack: false,
    canGoForward: false,
    title: "",
    loading: false,
  },
  onStateChange: jest.fn(),
};

describe("BorrowWebView", () => {
  it("renders top bar when dev tools are enabled", () => {
    render(<BorrowWebView {...defaultProps} enablePlatformDevTools />);

    expect(screen.getByTestId("borrow-top-bar")).toBeVisible();
    expect(screen.getByTestId("borrow-web3app-webview")).toBeVisible();
    expect(jest.mocked(useDeeplinkCustomHandlers)).toHaveBeenCalled();
  });

  it("does not render top bar when dev tools are disabled", () => {
    render(<BorrowWebView {...defaultProps} enablePlatformDevTools={false} />);

    expect(screen.queryByTestId("borrow-top-bar")).not.toBeInTheDocument();
    expect(screen.getByTestId("borrow-web3app-webview")).toBeVisible();
  });
});
