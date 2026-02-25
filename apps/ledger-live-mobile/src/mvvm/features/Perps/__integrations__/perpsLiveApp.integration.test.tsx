import React from "react";
import { render, screen } from "@tests/test-renderer";
import { PerpsLiveAppWrapper } from "../screens/PerpsLiveApp/PerpsLiveAppWrapper";

jest.mock("../screens/PerpsLiveApp/usePerpsLiveAppViewModel", () => ({
  usePerpsLiveAppViewModel: () => ({
    manifest: undefined,
    error: null,
    isLoading: false,
    webviewRef: { current: null },
    onWebviewStateChange: jest.fn(),
  }),
}));

describe("Perps feature integration test", () => {
  it("should render the Perps live app container", () => {
    render(<PerpsLiveAppWrapper />);

    expect(screen.getByTestId("perps-tab")).toBeOnTheScreen();
  });
});
