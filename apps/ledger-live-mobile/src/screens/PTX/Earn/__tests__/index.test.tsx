import React from "react";
import { render, withFlagOverrides } from "@tests/test-renderer";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useVersionedStakePrograms } from "LLM/hooks/useStake/useVersionedStakePrograms";
import { EarnScreen } from "../index";
import type { EarnV2Webview } from "../EarnV2Webview";

type EarnV2WebviewProps = React.ComponentProps<typeof EarnV2Webview>;

const capturedProps: { current: EarnV2WebviewProps | undefined } = { current: undefined };

// Mock the child to assert wiring only; canvas logic is covered in getEarnScreenOptions.test.ts.
jest.mock("../EarnV2Webview", () => ({
  EarnV2Webview: (props: EarnV2WebviewProps) => {
    capturedProps.current = props;
    return null;
  },
}));

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppManifest: jest.fn(),
  useRemoteLiveAppContext: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppManifest: jest.fn(),
}));

jest.mock("LLM/hooks/useStake/useVersionedStakePrograms", () => ({
  useVersionedStakePrograms: jest.fn(),
}));

jest.mock("~/helpers/getStakeLabelLocaleBased", () => ({
  getCountryLocale: jest.fn().mockReturnValue("US"),
}));

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

const makeProps = (intent: "deposit" | "simulate") =>
  ({
    navigation: {} as never,
    route: { params: { intent } },
  }) as React.ComponentProps<typeof EarnScreen>;

const renderEarnScreen = (
  intent: "deposit" | "simulate",
  flags: Parameters<typeof withFlagOverrides>[0],
) =>
  render(<EarnScreen {...makeProps(intent)} />, {
    overrideInitialState: withFlagOverrides(flags),
  });

describe("EarnScreen canvas background wiring", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedProps.current = undefined;
    jest.mocked(useLocalLiveAppManifest).mockReturnValue(undefined);
    jest.mocked(useRemoteLiveAppManifest).mockReturnValue(STUB_MANIFEST);
    jest.mocked(useRemoteLiveAppContext).mockReturnValue({
      state: { isLoading: false },
    } as ReturnType<typeof useRemoteLiveAppContext>);
    jest.mocked(useVersionedStakePrograms).mockReturnValue(null);
  });

  it("should pass shouldDisplayBackgroundCanvas true when deposit intent and swapToEarn is enabled", () => {
    renderEarnScreen("deposit", {
      lwmWallet40: { enabled: true },
      swapToEarn: { enabled: true },
    });

    expect(capturedProps.current).toBeDefined();
    expect(capturedProps.current?.shouldDisplayBackgroundCanvas).toBe(true);
  });

  it("should pass shouldDisplayBackgroundCanvas false when deposit intent and swapToEarn is disabled", () => {
    renderEarnScreen("deposit", {
      lwmWallet40: { enabled: true },
      swapToEarn: { enabled: false },
    });

    expect(capturedProps.current).toBeDefined();
    expect(capturedProps.current?.shouldDisplayBackgroundCanvas).toBe(false);
  });

  it("should pass shouldDisplayBackgroundCanvas true when simulate intent regardless of swapToEarn", () => {
    renderEarnScreen("simulate", {
      lwmWallet40: { enabled: true },
      swapToEarn: { enabled: false },
    });

    expect(capturedProps.current).toBeDefined();
    expect(capturedProps.current?.shouldDisplayBackgroundCanvas).toBe(true);
  });
});
