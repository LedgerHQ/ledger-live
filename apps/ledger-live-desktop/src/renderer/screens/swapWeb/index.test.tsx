import React from "react";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import Swap from "./index";

type WebPlatformPlayerProps = Readonly<{
  inputs: Record<string, string | undefined>;
}>;

const mockWebPlatformPlayer = jest.fn((_props: WebPlatformPlayerProps) => (
  <div data-testid="swap-web-platform-player" />
));

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppManifest: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppManifest: jest.fn(),
}));
jest.mock("~/renderer/components/WebPlatformPlayer", () => ({
  __esModule: true,
  default: (props: WebPlatformPlayerProps) => mockWebPlatformPlayer(props),
}));

const mockedUseRemoteLiveAppManifest = jest.mocked(useRemoteLiveAppManifest);
const mockedUseLocalLiveAppManifest = jest.mocked(useLocalLiveAppManifest);

const manifest: LiveAppManifest = {
  id: "swapWeb",
  name: "Swap",
  private: false,
  url: "https://swap.example",
  homepageUrl: "https://swap.example",
  icon: "",
  platforms: ["desktop"],
  apiVersion: "^2.0.0",
  manifestVersion: "2",
  branch: "stable",
  categories: [],
  currencies: "*",
  content: { shortDescription: { en: "Swap" }, description: { en: "Swap" } },
  permissions: [],
  domains: ["https://swap.example"],
  visibility: "complete",
};

describe("SwapWeb screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRemoteLiveAppManifest.mockReturnValue(manifest);
    mockedUseLocalLiveAppManifest.mockReturnValue(undefined);
  });

  it("should pass lldWalletApiDeviceIntentSign variant and enabled strings in inputs", () => {
    render(<Swap />, {
      initialState: withFlagOverrides({
        lldWalletApiDeviceIntentSign: {
          enabled: true,
          params: { variantId: "variant_a", enabledManifestIds: ["swapWeb"] },
        },
      }),
    });

    expect(screen.getByTestId("swap-web-platform-player")).toBeVisible();
    const lastCall = mockWebPlatformPlayer.mock.calls.at(-1)?.[0];
    expect(lastCall?.inputs.lldWalletApiDeviceIntentSignVariant).toBe("variant_a");
    expect(lastCall?.inputs.lldWalletApiDeviceIntentSignEnabled).toBe("true");
  });

  it("should pass lldWalletApiDeviceIntentSignEnabled=false when manifest is not allowlisted", () => {
    render(<Swap />, {
      initialState: withFlagOverrides({
        lldWalletApiDeviceIntentSign: {
          enabled: true,
          params: { variantId: "variant_a", enabledManifestIds: ["other-app"] },
        },
      }),
    });

    const lastCall = mockWebPlatformPlayer.mock.calls.at(-1)?.[0];
    expect(lastCall?.inputs.lldWalletApiDeviceIntentSignVariant).toBe("variant_a");
    expect(lastCall?.inputs.lldWalletApiDeviceIntentSignEnabled).toBe("false");
  });
});
