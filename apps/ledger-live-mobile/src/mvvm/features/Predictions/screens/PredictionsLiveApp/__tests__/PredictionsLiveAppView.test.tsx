import React from "react";
import { render, screen } from "@tests/test-renderer";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { PredictionsLiveAppView } from "../PredictionsLiveAppView";
import type { PredictionsLiveAppViewModel } from "../usePredictionsLiveAppViewModel";

jest.mock("~/components/Web3AppWebview", () => {
  const { View } = jest.requireActual("react-native");
  return { Web3AppWebview: () => <View testID="predictions-webview" /> };
});

const baseProps: PredictionsLiveAppViewModel = {
  manifest: { id: "predictions-live-app" } as LiveAppManifest,
  error: null,
  isLoading: false,
  webviewInputs: {},
  customHandlers: {},
  webviewRef: { current: null },
  onWebviewStateChange: jest.fn(),
  onBack: jest.fn(),
};

describe("PredictionsLiveAppView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the live app", () => {
    render(<PredictionsLiveAppView {...baseProps} />);

    expect(screen.getByTestId("predictions-webview")).toBeOnTheScreen();
  });

  it("should not render the live app when there is an error", () => {
    render(
      <PredictionsLiveAppView
        {...baseProps}
        manifest={undefined}
        error={new Error("Manifest not found")}
      />,
    );

    expect(screen.queryByTestId("predictions-webview")).toBeNull();
  });

  it("should let the user go back from the error screen", async () => {
    const { user } = render(
      <PredictionsLiveAppView
        {...baseProps}
        manifest={undefined}
        error={new Error("Manifest not found")}
      />,
    );

    await user.press(screen.getByLabelText("Back"));

    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });
});
