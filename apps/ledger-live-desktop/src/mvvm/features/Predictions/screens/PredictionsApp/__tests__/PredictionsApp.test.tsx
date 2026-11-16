import React from "react";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { render, screen } from "tests/testSetup";
import { PredictionsApp } from "../index";
import { usePredictionsAppViewModel } from "../usePredictionsAppViewModel";

jest.mock("../usePredictionsAppViewModel", () => ({
  usePredictionsAppViewModel: jest.fn(),
}));

jest.mock("~/renderer/components/Web3AppWebview/NetworkError", () => ({
  NetworkErrorScreen: () => <div>network error</div>,
}));

jest.mock("~/renderer/components/Web3AppWebview", () => ({
  Web3AppWebview: () => <div data-testid="predictions-webview" />,
}));

jest.mock("~/renderer/components/WebPlatformPlayer/TopBar", () => ({
  TopBar: () => <div data-testid="predictions-top-bar" />,
}));

type PredictionsAppViewModel = ReturnType<typeof usePredictionsAppViewModel>;

const baseViewModel: PredictionsAppViewModel = {
  manifest: { id: "predictions-live-app" } as LiveAppManifest,
  isCatalogLoading: false,
  refreshManifests: jest.fn(),
  inputs: {} as PredictionsAppViewModel["inputs"],
  customHandlers: {},
  enablePlatformDevTools: false,
  webviewAPIRef: { current: null },
  webviewState: {} as PredictionsAppViewModel["webviewState"],
  onStateChange: jest.fn(),
};

function renderApp(overrides: Partial<PredictionsAppViewModel> = {}) {
  jest.mocked(usePredictionsAppViewModel).mockReturnValue({ ...baseViewModel, ...overrides });
  render(<PredictionsApp />);
}

describe("PredictionsApp", () => {
  it("should render the live app without the browser top bar", () => {
    renderApp();

    expect(screen.getByTestId("predictions-webview")).toBeVisible();
    expect(screen.queryByTestId("predictions-top-bar")).not.toBeInTheDocument();
  });

  it("should show the top bar only with the platform dev tools", () => {
    renderApp({ enablePlatformDevTools: true });

    expect(screen.getByTestId("predictions-top-bar")).toBeVisible();
  });

  it("should render the network error when the manifest is missing", () => {
    renderApp({ manifest: undefined });

    expect(screen.getByText("network error")).toBeVisible();
    expect(screen.queryByTestId("predictions-webview")).not.toBeInTheDocument();
  });

  it("should not render the network error while the live app catalog is loading", () => {
    renderApp({ manifest: undefined, isCatalogLoading: true });

    expect(screen.queryByText("network error")).not.toBeInTheDocument();
    expect(screen.queryByTestId("predictions-webview")).not.toBeInTheDocument();
  });
});
