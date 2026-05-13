import React from "react";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { EarnV2Webview } from "../index";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppContext: () => ({ state: { isLoading: false } }),
}));

jest.mock("LLM/hooks/useNavigationBarHeights", () => ({
  useNavigationBarHeights: () => ({ topBarHeight: 0, bottomBarHeight: 0 }),
}));

jest.mock("../../EarnWebview", () => {
  const { View } = require("react-native");
  return { EarnWebview: () => <View testID="earn-webview" /> };
});

jest.mock("LLM/components/LiveAppBackground", () => {
  const { View } = require("react-native");
  return { LiveAppBackground: () => <View testID="live-app-background" /> };
});

const STUB_MANIFEST: LiveAppManifest = {
  id: "earn-test",
  name: "Earn Test",
  url: "https://earn.test",
  homepageUrl: "https://earn.test",
  platforms: ["ios", "android"],
  apiVersion: "2.0.0",
  manifestVersion: "2",
  branch: "stable",
  permissions: [],
  domains: [],
  categories: [],
  currencies: "*",
  visibility: "complete",
  content: {
    shortDescription: { en: "test" },
    description: { en: "test" },
  },
};

const ERROR = new Error("manifest not found");

describe("EarnV2Webview", () => {
  it("renders LiveAppBackground when ptxEarnUi is v2", () => {
    render(<EarnV2Webview manifest={STUB_MANIFEST} appManifestNotFoundError={ERROR} />, {
      overrideInitialState: withFlagOverrides({
        ptxEarnUi: { enabled: true, params: { value: "v2" } },
      }),
    });

    expect(screen.getByTestId("live-app-background")).toBeTruthy();
  });

  it("renders LiveAppBackground when ptxEarnUi is v3 (minimum v2 check)", () => {
    render(<EarnV2Webview manifest={STUB_MANIFEST} appManifestNotFoundError={ERROR} />, {
      overrideInitialState: withFlagOverrides({
        ptxEarnUi: { enabled: true, params: { value: "v3" } },
      }),
    });

    expect(screen.getByTestId("live-app-background")).toBeTruthy();
  });

  it("does not render LiveAppBackground when ptxEarnUi is v1", () => {
    render(<EarnV2Webview manifest={STUB_MANIFEST} appManifestNotFoundError={ERROR} />, {
      overrideInitialState: withFlagOverrides({
        ptxEarnUi: { enabled: true, params: { value: "v1" } },
      }),
    });

    expect(screen.queryByTestId("live-app-background")).toBeNull();
  });

  it("does not render LiveAppBackground when hideMainNavigator is true", () => {
    render(
      <EarnV2Webview manifest={STUB_MANIFEST} appManifestNotFoundError={ERROR} hideMainNavigator />,
      {
        overrideInitialState: withFlagOverrides({
          ptxEarnUi: { enabled: true, params: { value: "v2" } },
        }),
      },
    );

    expect(screen.queryByTestId("live-app-background")).toBeNull();
  });
});
