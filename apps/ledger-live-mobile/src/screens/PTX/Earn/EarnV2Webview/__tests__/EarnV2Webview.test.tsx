import React from "react";
import { StyleSheet } from "react-native";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { EarnV2Webview } from "../index";
import { BASE_NAVIGATOR_ID, NavigatorName } from "~/const";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();
const mockGetParent = jest.fn(() => ({ setOptions: mockSetOptions }));
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate, getParent: mockGetParent }),
}));

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppContext: () => ({ state: { isLoading: false } }),
}));

jest.mock("LLM/hooks/useNavigationBarHeights", () => ({
  useNavigationBarHeights: () => ({ topBarHeight: 0, bottomBarHeight: 0 }),
}));

let mockWebviewUrl: string | undefined;

jest.mock("../../EarnWebview", () => {
  const { View } = require("react-native");
  const ReactLib = require("react");
  return {
    EarnWebview: ({
      onWebviewStateChange,
    }: {
      onWebviewStateChange?: (state: { url?: string }) => void;
    }) => {
      ReactLib.useEffect(() => {
        onWebviewStateChange?.({ url: mockWebviewUrl });
      }, [onWebviewStateChange]);
      return <View testID="earn-webview" />;
    },
  };
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
  beforeEach(() => {
    mockWebviewUrl = undefined;
    mockNavigate.mockClear();
    mockSetOptions.mockClear();
  });

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

  it("keeps LiveAppBackground hidden while the webview is on a deposit URL", () => {
    mockWebviewUrl = "https://earn.test/v2/android/deposit?intent=deposit&uiVersion=v4";

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

  it("restores LiveAppBackground when the webview navigates back to the dashboard despite a stale deposit intent", () => {
    mockWebviewUrl = "https://earn.test/v2/android/homescreen?uiVersion=v4";

    render(
      <EarnV2Webview manifest={STUB_MANIFEST} appManifestNotFoundError={ERROR} hideMainNavigator />,
      {
        overrideInitialState: withFlagOverrides({
          ptxEarnUi: { enabled: true, params: { value: "v2" } },
        }),
      },
    );

    expect(screen.getByTestId("live-app-background")).toBeTruthy();
  });

  it("returns to the Earn dashboard tab when the intent flow webview navigates out of the intent route", () => {
    jest.useFakeTimers();
    mockWebviewUrl = "https://earn.test/v2/android/homescreen?uiVersion=v4";

    render(
      <EarnV2Webview manifest={STUB_MANIFEST} appManifestNotFoundError={ERROR} hideMainNavigator />,
      {
        overrideInitialState: withFlagOverrides({
          ptxEarnUi: { enabled: true, params: { value: "v2" } },
        }),
      },
    );

    expect(mockNavigate).not.toHaveBeenCalled();
    jest.advanceTimersByTime(500);

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Main, {
      screen: NavigatorName.Earn,
    });

    jest.useRealTimers();
  });

  it("syncs the Base-stack native header (not route params) when the webview navigates from simulate to deposit", () => {
    mockWebviewUrl = "https://earn.test/v2/android/deposit?intent=deposit&uiVersion=v4";

    render(
      <EarnV2Webview
        manifest={STUB_MANIFEST}
        appManifestNotFoundError={ERROR}
        hideMainNavigator
        inputs={{ intent: "simulate" }}
      />,
      {
        overrideInitialState: withFlagOverrides({
          ptxEarnUi: { enabled: true, params: { value: "v2" } },
        }),
      },
    );

    // The header is driven imperatively via the parent navigator's options — NOT by mutating
    // route params (a cross-navigator merge-navigate wipes them and blanks the screen).
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockGetParent).toHaveBeenCalledWith(BASE_NAVIGATOR_ID);
    const options = mockSetOptions.mock.calls.at(-1)?.[0];
    // Deposit-specific header: titled, non-closable, and (unlike simulate) no canvas headerStyle —
    // proving the header tracked the webview's deposit route, not the entry simulate intent.
    expect(options).toEqual(expect.objectContaining({ headerShown: true, closable: false }));
    expect(options.headerTitle).toBeTruthy();
    expect(options.headerStyle).toBeUndefined();
  });

  it("does not leave the intent flow presentation while the webview is still on the deposit route", () => {
    mockWebviewUrl = "https://earn.test/v2/android/deposit?intent=deposit&uiVersion=v4";

    render(
      <EarnV2Webview
        manifest={STUB_MANIFEST}
        appManifestNotFoundError={ERROR}
        hideMainNavigator
        inputs={{ intent: "deposit" }}
      />,
      {
        overrideInitialState: withFlagOverrides({
          ptxEarnUi: { enabled: true, params: { value: "v2" } },
        }),
      },
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does not leave the intent flow presentation while the webview URL is still unknown (initial empty state)", () => {
    // Regression: on intent flow entry the webview first reports an empty URL. Treating "" as a known
    // non-intent route bounced the user straight back to the homescreen before the route loaded.
    mockWebviewUrl = "";

    render(
      <EarnV2Webview manifest={STUB_MANIFEST} appManifestNotFoundError={ERROR} hideMainNavigator />,
      {
        overrideInitialState: withFlagOverrides({
          ptxEarnUi: { enabled: true, params: { value: "v2" } },
        }),
      },
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("keeps LiveAppBackground hidden while the webview URL is still unknown (intent flow first paint)", () => {
    mockWebviewUrl = "";

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

  it.each(["about:blank", "data:text/html,<html></html>"])(
    "does not leave the intent flow presentation for transient non-http(s) URLs (%s)",
    transientUrl => {
      // Regression: WebViews transiently report non-http(s) URLs (e.g. about:blank) during load.
      // These are parseable but not navigational routes, so they must not be treated as a known
      // non-intent route, otherwise we'd bounce out of the intent flow on entry.
      mockWebviewUrl = transientUrl;

      render(
        <EarnV2Webview
          manifest={STUB_MANIFEST}
          appManifestNotFoundError={ERROR}
          hideMainNavigator
        />,
        {
          overrideInitialState: withFlagOverrides({
            ptxEarnUi: { enabled: true, params: { value: "v2" } },
          }),
        },
      );

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.queryByTestId("live-app-background")).toBeNull();
    },
  );

  it("does not navigate from the dashboard tab instance (hideMainNavigator false)", () => {
    mockWebviewUrl = "https://earn.test/v2/android/homescreen?uiVersion=v4";

    render(<EarnV2Webview manifest={STUB_MANIFEST} appManifestNotFoundError={ERROR} />, {
      overrideInitialState: withFlagOverrides({
        ptxEarnUi: { enabled: true, params: { value: "v2" } },
      }),
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("paints the live-app canvas behind the webview for the simulate intent", () => {
    render(
      <EarnV2Webview
        manifest={STUB_MANIFEST}
        appManifestNotFoundError={ERROR}
        inputs={{ intent: "simulate" }}
      />,
      {
        overrideInitialState: withFlagOverrides({
          ptxEarnUi: { enabled: true, params: { value: "v2" } },
        }),
      },
    );

    const flattened = StyleSheet.flatten(screen.getByTestId("earn-screen").props.style);
    expect(flattened.backgroundColor).toEqual(expect.any(String));
  });

  it("does not override the screen background outside the simulate intent", () => {
    render(
      <EarnV2Webview
        manifest={STUB_MANIFEST}
        appManifestNotFoundError={ERROR}
        inputs={{ intent: "deposit" }}
      />,
      {
        overrideInitialState: withFlagOverrides({
          ptxEarnUi: { enabled: true, params: { value: "v2" } },
        }),
      },
    );

    const flattened = StyleSheet.flatten(screen.getByTestId("earn-screen").props.style);
    expect(flattened.backgroundColor).toBeUndefined();
  });
});
