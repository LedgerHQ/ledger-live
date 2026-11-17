import React from "react";
import { render, withFlagOverrides } from "@tests/test-renderer";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useVersionedStakePrograms } from "LLM/hooks/useStake/useVersionedStakePrograms";
import {
  NATIVE_STAKE_POSITION_INPUT_KEY,
  NATIVE_STAKE_POSITION_INPUT_VALUE,
} from "@features/flow-stake-position";
import { ScreenName } from "~/const";
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
    route: { key: "earn", name: ScreenName.Earn, params: { intent } },
  }) as unknown as React.ComponentProps<typeof EarnScreen>;

const renderEarnScreen = (
  intent: "deposit" | "simulate",
  flags: Parameters<typeof withFlagOverrides>[0],
) =>
  render(<EarnScreen {...makeProps(intent)} />, {
    overrideInitialState: withFlagOverrides(flags),
  });

const goToURLOf = (inputs: Record<string, string | undefined>) => new URL(inputs.goToURL ?? "");

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

  it("should pass stableSavings with enabled and params", () => {
    renderEarnScreen("deposit", {
      lwmWallet40: { enabled: true },
      stableSavings: { enabled: true, params: { cohort: "a" } },
    });

    expect(capturedProps.current?.inputs?.stableSavings).toBe(
      JSON.stringify({ enabled: true, params: { cohort: "a" } }),
    );
  });

  it("should pass stableSavings with enabled=false and no params key", () => {
    renderEarnScreen("deposit", {
      lwmWallet40: { enabled: true },
      stableSavings: { enabled: false },
    });

    expect(capturedProps.current?.inputs?.stableSavings).toBe(JSON.stringify({ enabled: false }));
  });

  it("should pass the device-intent sign flag state", () => {
    renderEarnScreen("deposit", {
      lwmWallet40: { enabled: true },
      llmWalletApiDeviceIntentSign: { enabled: true },
    });

    expect(capturedProps.current?.inputs?.llmWalletApiDeviceIntentSignEnabled).toBe("true");
  });

  describe("native stake position input", () => {
    const KEY = NATIVE_STAKE_POSITION_INPUT_KEY;
    const DAPP_URL = "https://dapp.test/stake";
    const FLAG_ON = { lwmWallet40: { enabled: true }, earnNativeStakePosition: { enabled: true } };
    const FLAG_OFF = {
      lwmWallet40: { enabled: true },
      earnNativeStakePosition: { enabled: false },
    };

    type EarnRoute = { params?: Record<string, string>; path?: string };

    const renderEarnRoute = (flags: Parameters<typeof withFlagOverrides>[0], route: EarnRoute) => {
      const props = {
        navigation: {} as never,
        route: {
          key: "earn",
          name: ScreenName.Earn,
          params: { intent: "deposit", ...route.params },
          path: route.path,
        },
      } as unknown as React.ComponentProps<typeof EarnScreen>;

      render(<EarnScreen {...props} />, { overrideInitialState: withFlagOverrides(flags) });

      return capturedProps.current?.inputs ?? {};
    };

    const claims = (value: string): Array<[string, EarnRoute]> => [
      ["a route param", { params: { [KEY]: value } }],
      ["a deeplink path", { path: `earn?${KEY}=${value}` }],
    ];

    it("should tell the live app it opens native stake positions when the flag is on", () => {
      const inputs = renderEarnRoute(FLAG_ON, {});

      expect(inputs[KEY]).toBe(NATIVE_STAKE_POSITION_INPUT_VALUE);
    });

    it.each(claims("false"))(
      "should not let %s override it when the flag is on",
      (_source, route) => {
        const inputs = renderEarnRoute(FLAG_ON, route);

        expect(inputs[KEY]).toBe(NATIVE_STAKE_POSITION_INPUT_VALUE);
      },
    );

    it("should carry it in the goToURL when the flag is on, whatever the route and the dapp URL say", () => {
      const inputs = renderEarnRoute(FLAG_ON, {
        params: { customDappUrl: `${DAPP_URL}?${KEY}=false`, [KEY]: "false" },
        path: `earn?${KEY}=false`,
      });

      const goToURL = goToURLOf(inputs);
      expect(goToURL.origin + goToURL.pathname).toBe(DAPP_URL);
      expect(goToURL.searchParams.get("intent")).toBe("deposit");
      expect(goToURL.searchParams.get(KEY)).toBe(NATIVE_STAKE_POSITION_INPUT_VALUE);
      expect(inputs[KEY]).toBe(NATIVE_STAKE_POSITION_INPUT_VALUE);
    });

    it.each([
      ["off", FLAG_OFF],
      ["not set", { lwmWallet40: { enabled: true } }],
    ])("should leave the input out when the flag is %s", (_state, flags) => {
      const inputs = renderEarnRoute(flags, {});

      expect(inputs).not.toHaveProperty(KEY);
    });

    it.each(claims("true"))("should not let %s grant it when the flag is off", (_source, route) => {
      const inputs = renderEarnRoute(FLAG_OFF, route);

      expect(inputs).not.toHaveProperty(KEY);
    });

    it("should leave it out of the goToURL when the flag is off, whatever the route says", () => {
      const inputs = renderEarnRoute(FLAG_OFF, {
        params: { customDappUrl: DAPP_URL, [KEY]: "true" },
        path: `earn?${KEY}=true`,
      });

      const goToURL = goToURLOf(inputs);
      expect(goToURL.origin + goToURL.pathname).toBe(DAPP_URL);
      expect(goToURL.searchParams.get("intent")).toBe("deposit");
      expect(goToURL.searchParams.has(KEY)).toBe(false);
      expect(inputs).not.toHaveProperty(KEY);
    });

    it.each([
      ["off", FLAG_OFF],
      ["not set", { lwmWallet40: { enabled: true } }],
    ])("should drop the capability a dapp URL carries when the flag is %s", (_state, flags) => {
      const inputs = renderEarnRoute(flags, {
        params: { customDappUrl: `${DAPP_URL}?${KEY}=true` },
      });

      const goToURL = goToURLOf(inputs);
      expect(goToURL.origin + goToURL.pathname).toBe(DAPP_URL);
      expect(goToURL.searchParams.get("intent")).toBe("deposit");
      expect(goToURL.searchParams.has(KEY)).toBe(false);
      expect(inputs).not.toHaveProperty(KEY);
    });
  });
});
