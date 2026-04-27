import React from "react";
import { render, screen } from "tests/testSetup";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";
import { useBorrowLiveConfig } from "LLD/features/Borrow/hooks/useBorrowLiveConfig";
import BorrowApp from "..";

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppManifest: jest.fn(),
  useRemoteLiveAppContext: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppManifest: jest.fn(),
}));

jest.mock("~/renderer/components/Discreet", () => ({
  useDiscreetMode: jest.fn(),
}));

jest.mock("~/helpers/systemLocale", () => ({
  ...jest.requireActual("~/helpers/systemLocale"),
  getParsedSystemDeviceLocale: jest.fn(),
}));

jest.mock("LLD/features/Borrow/hooks/useBorrowLiveConfig", () => ({
  useBorrowLiveConfig: jest.fn(),
}));

jest.mock("~/renderer/hooks/useTheme", () => ({
  __esModule: true,
  default: jest.fn(() => ({ theme: "dark" })),
}));

jest.mock("~/renderer/components/Web3AppWebview", () => ({
  Web3AppWebview: () => <div data-testid="borrow-web3-webview" />,
}));

jest.mock("~/renderer/components/Web3AppWebview/NetworkError", () => ({
  NetworkErrorScreen: ({ refresh }: { refresh: () => void }) => (
    <button onClick={refresh} type="button" data-testid="borrow-network-error">
      Try again
    </button>
  ),
}));

const remoteManifest = { id: "borrow", url: "https://borrow.example" } as LiveAppManifest;
const mockUpdateManifests = jest.fn();

describe("Borrow integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(useRemoteLiveAppContext).mockReturnValue({
      updateManifests: mockUpdateManifests,
    } as unknown as ReturnType<typeof useRemoteLiveAppContext>);
    jest.mocked(useRemoteLiveAppManifest).mockReturnValue(remoteManifest);
    jest.mocked(useLocalLiveAppManifest).mockReturnValue(undefined);
    jest.mocked(useDiscreetMode).mockReturnValue(false);
    jest.mocked(getParsedSystemDeviceLocale).mockReturnValue({
      region: "US",
    } as ReturnType<typeof getParsedSystemDeviceLocale>);
    jest.mocked(useBorrowLiveConfig).mockReturnValue(null);
  });

  it("should render the webview when a remote manifest is available", () => {
    render(<BorrowApp />);

    expect(screen.getByTestId("borrow-web3-webview")).toBeVisible();
    expect(screen.queryByTestId("borrow-network-error")).not.toBeInTheDocument();
  });

  it("should prefer the local manifest over the remote one", () => {
    const localManifest = { id: "borrow-local", url: "https://local.example" } as LiveAppManifest;
    jest.mocked(useLocalLiveAppManifest).mockReturnValue(localManifest);

    render(<BorrowApp />);

    expect(screen.getByTestId("borrow-web3-webview")).toBeVisible();
  });

  it("should render the network error screen when no manifest is found", () => {
    jest.mocked(useRemoteLiveAppManifest).mockReturnValue(undefined);

    render(<BorrowApp />);

    expect(screen.getByTestId("borrow-network-error")).toBeVisible();
    expect(screen.queryByTestId("borrow-web3-webview")).not.toBeInTheDocument();
  });

  it("should call updateManifests when the error screen refresh button is clicked", async () => {
    jest.mocked(useRemoteLiveAppManifest).mockReturnValue(undefined);

    const { user } = render(<BorrowApp />);

    await user.click(screen.getByTestId("borrow-network-error"));

    expect(mockUpdateManifests).toHaveBeenCalledTimes(1);
  });
});
