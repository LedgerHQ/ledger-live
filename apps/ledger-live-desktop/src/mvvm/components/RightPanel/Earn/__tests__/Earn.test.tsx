import React from "react";
import { render, screen } from "tests/testSetup";
import { Earn } from "../Earn";

const mockManifest = jest.fn();
jest.mock("../useEarnDepositManifest", () => ({
  useEarnDepositManifest: () => mockManifest(),
}));
jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index"),
  useRemoteLiveAppContext: () => ({ updateManifests: jest.fn(), state: { isLoading: false } }),
}));
jest.mock("~/renderer/components/Web3AppWebview/NetworkError", () => ({
  NetworkErrorScreen: () => <div data-testid="network-error" />,
}));
jest.mock("~/renderer/components/WebPlatformPlayer", () => ({
  __esModule: true,
  default: ({ manifest, inputs }: { manifest: { url: URL }; inputs: Record<string, string> }) => (
    <div data-testid="player" data-url={manifest.url.toString()} data-theme={inputs.theme} />
  ),
}));

describe("Earn right panel", () => {
  it("renders the player on the deposit widget manifest", () => {
    mockManifest.mockReturnValue({ id: "earn", url: new URL("http://x.test/deposit-widget") });
    render(<Earn />);
    expect(screen.getByTestId("player")).toHaveAttribute("data-url", "http://x.test/deposit-widget");
  });

  it("renders the warning when no manifest is available", () => {
    mockManifest.mockReturnValue(undefined);
    render(<Earn />);
    expect(screen.getByTestId("earn-deposit-widget-warning")).toBeVisible();
  });
});
