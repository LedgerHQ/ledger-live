import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import {
  NATIVE_STAKE_POSITION_INPUT_KEY,
  NATIVE_STAKE_POSITION_INPUT_VALUE,
} from "@features/flow-stake-position";
import { useDeepLinkListener } from "./useDeepLinkListener";
import Earn from ".";

const mockWebPlatformPlayer = jest.fn((_props: unknown) => (
  <div data-testid="earn-web-platform-player" />
));

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppManifest: jest.fn(),
  useRemoteLiveAppContext: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppManifest: jest.fn(),
}));

jest.mock("./useDeepLinkListener", () => ({
  useDeepLinkListener: jest.fn(),
}));
jest.mock("~/renderer/components/WebPlatformPlayer", () => ({
  __esModule: true,
  default: (props: unknown) => mockWebPlatformPlayer(props),
}));

const mockedUseRemoteLiveAppManifest = jest.mocked(useRemoteLiveAppManifest);
const mockedUseRemoteLiveAppContext = jest.mocked(useRemoteLiveAppContext);
const mockedUseLocalLiveAppManifest = jest.mocked(useLocalLiveAppManifest);
const mockedUseDeepLinkListener = jest.mocked(useDeepLinkListener);

const manifest = {
  id: "earn-manifest-id",
  name: "Earn",
  url: "https://earn.example",
} as never;

describe("Earn screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRemoteLiveAppManifest.mockReturnValue(manifest);
    mockedUseLocalLiveAppManifest.mockReturnValue(undefined);
    mockedUseRemoteLiveAppContext.mockReturnValue({ updateManifests: jest.fn() } as never);
    mockedUseDeepLinkListener.mockImplementation(jest.fn());
  });

  it("passes enabled uiVersion and lw40enabled=true when feature is enabled", () => {
    render(<Earn />, {
      initialState: withFlagOverrides({
        ptxEarnLiveApp: { enabled: true, params: { manifest_id: "earn-manifest-id" } },
        ptxEarnUi: { enabled: true, params: { value: "v2" } },
        lwdWallet40: { enabled: true },
        stakePrograms: {
          enabled: true,
          params: {
            list: ["ethereum", "bitcoin"],
            redirects: {
              ethereum: {
                platform: "earn",
                name: "",
                queryParams: { ethDepositCohort: "cohort-a" },
              },
              bitcoin: {
                platform: "stakekit",
                name: "",
              },
            },
          },
        } as never,
      }),
    });

    expect(mockWebPlatformPlayer).toHaveBeenCalled();
    const lastCall = mockWebPlatformPlayer.mock.calls.at(-1)?.[0] as unknown as {
      inputs: Record<string, string | undefined>;
    };

    expect(screen.getByTestId("earn-web-platform-player")).toBeVisible();
    expect(lastCall.inputs.uiVersion).toBe("v2");
    expect(lastCall.inputs.lw40enabled).toBe("true");
    expect(lastCall.inputs.stakeProgramsParam).toBe(
      JSON.stringify({ ethereum: "earn", bitcoin: "stakekit" }),
    );
    expect(lastCall.inputs.stakeCurrenciesParam).toBe(JSON.stringify(["ethereum", "bitcoin"]));
    expect(lastCall.inputs.ethDepositCohort).toBe("cohort-a");
  });

  it("passes goToURL when location state includes customDappUrl", () => {
    const customDappUrl = "https://earn.example/?yieldId=tron-native-staking&accountId=abc";
    const useLocationSpy = jest.spyOn(require("react-router"), "useLocation").mockReturnValue({
      pathname: "/earn",
      search: "",
      hash: "",
      state: { customDappUrl },
    });

    render(<Earn />, {
      initialState: withFlagOverrides({
        ptxEarnLiveApp: { enabled: true, params: { manifest_id: "earn-manifest-id" } },
        stakePrograms: { enabled: true, params: { list: [], redirects: {} } } as never,
        swapToEarn: { enabled: true, params: { foo: "bar" } } as never,
      }),
    });

    const lastCall = mockWebPlatformPlayer.mock.calls.at(-1)?.[0] as unknown as {
      inputs: Record<string, string | undefined>;
    };

    const goToURL = lastCall.inputs.goToURL as string;
    expect(goToURL).toContain("yieldId=tron-native-staking");
    expect(goToURL).toContain("accountId=abc");
    expect(goToURL).toContain("theme=");
    expect(goToURL).toContain("lang=");
    expect(goToURL).toContain("uiVersion=");
    expect(goToURL).toContain("lw40enabled=");
    expect(goToURL).toContain(
      `swapToEarn=${encodeURIComponent(JSON.stringify({ enabled: true, params: { foo: "bar" } }))}`,
    );
    useLocationSpy.mockRestore();
  });

  it("passes deposit intent params in inputs like mobile route params", () => {
    const useLocationSpy = jest.spyOn(require("react-router"), "useLocation").mockReturnValue({
      pathname: "/earn",
      search: "",
      hash: "",
      state: { intent: "deposit", cryptoAssetId: "bitcoin" },
    });

    render(<Earn />, {
      initialState: withFlagOverrides({
        ptxEarnLiveApp: { enabled: true, params: { manifest_id: "earn-manifest-id" } },
        stakePrograms: { enabled: true, params: { list: [], redirects: {} } } as never,
      }),
    });

    const lastCall = mockWebPlatformPlayer.mock.calls.at(-1)?.[0] as unknown as {
      inputs: Record<string, string | undefined>;
    };

    expect(lastCall.inputs.intent).toBe("deposit");
    expect(lastCall.inputs.cryptoAssetId).toBe("bitcoin");
    useLocationSpy.mockRestore();
  });

  it("passes simulate intent params in inputs like mobile route params", () => {
    const useLocationSpy = jest.spyOn(require("react-router"), "useLocation").mockReturnValue({
      pathname: "/earn",
      search: "",
      hash: "",
      state: { intent: "simulate" },
    });

    render(<Earn />, {
      initialState: withFlagOverrides({
        ptxEarnLiveApp: { enabled: true, params: { manifest_id: "earn-manifest-id" } },
        stakePrograms: { enabled: true, params: { list: [], redirects: {} } } as never,
      }),
    });

    const lastCall = mockWebPlatformPlayer.mock.calls.at(-1)?.[0] as unknown as {
      inputs: Record<string, string | undefined>;
    };

    expect(lastCall.inputs.intent).toBe("simulate");
    useLocationSpy.mockRestore();
  });

  describe("native stake position input", () => {
    type EarnInputs = Record<string, string | undefined>;

    const customDappUrl = "https://earn.example/?yieldId=tron-native-staking&accountId=abc";
    let useLocationSpy: jest.SpyInstance;

    beforeEach(() => {
      useLocationSpy = jest.spyOn(require("react-router"), "useLocation");
    });

    afterEach(() => {
      useLocationSpy.mockRestore();
    });

    // Leaving `isEnabled` out overrides nothing: the flag keeps the default of the registry.
    function renderEarn({
      state,
      isEnabled,
    }: {
      state?: Record<string, string>;
      isEnabled?: boolean;
    } = {}): EarnInputs {
      useLocationSpy.mockReturnValue({ pathname: "/earn", search: "", hash: "", state });

      render(<Earn />, {
        initialState: withFlagOverrides({
          ptxEarnLiveApp: { enabled: true, params: { manifest_id: "earn-manifest-id" } },
          stakePrograms: { enabled: true, params: { list: [], redirects: {} } } as never,
          ...(isEnabled !== undefined && { earnNativeStakePosition: { enabled: isEnabled } }),
        }),
      });

      const lastCall = mockWebPlatformPlayer.mock.calls.at(-1)?.[0] as unknown as {
        inputs: EarnInputs;
      };
      return lastCall.inputs;
    }

    const goToURLQuery = ({ goToURL }: EarnInputs) => {
      expect(goToURL).toEqual(expect.stringContaining("yieldId=tron-native-staking"));
      return new URL(goToURL ?? "").searchParams;
    };

    describe("when the flag is on", () => {
      it("tells Earn it opens stake positions natively", () => {
        const inputs = renderEarn({ isEnabled: true });

        expect(inputs[NATIVE_STAKE_POSITION_INPUT_KEY]).toBe(NATIVE_STAKE_POSITION_INPUT_VALUE);
      });

      it("keeps telling it when the route state denies the capability", () => {
        const inputs = renderEarn({
          state: { [NATIVE_STAKE_POSITION_INPUT_KEY]: "false", intent: "deposit" },
          isEnabled: true,
        });

        expect(inputs[NATIVE_STAKE_POSITION_INPUT_KEY]).toBe(NATIVE_STAKE_POSITION_INPUT_VALUE);
        expect(inputs.intent).toBe("deposit");
        // Earn flattens `routerState` into its own query, where it would deny the capability again.
        expect(JSON.parse(inputs.routerState ?? "")).toEqual({ intent: "deposit" });
      });

      it("tells it on the goToURL path too", () => {
        const inputs = renderEarn({ state: { customDappUrl }, isEnabled: true });

        const query = goToURLQuery(inputs);
        expect(query.get(NATIVE_STAKE_POSITION_INPUT_KEY)).toBe(NATIVE_STAKE_POSITION_INPUT_VALUE);
        expect(query.get("accountId")).toBe("abc");
      });

      it("keeps telling it on the goToURL path when the route state denies the capability", () => {
        const inputs = renderEarn({
          state: { customDappUrl, [NATIVE_STAKE_POSITION_INPUT_KEY]: "false" },
          isEnabled: true,
        });

        expect(goToURLQuery(inputs).get(NATIVE_STAKE_POSITION_INPUT_KEY)).toBe(
          NATIVE_STAKE_POSITION_INPUT_VALUE,
        );
      });
    });

    describe.each<[string, boolean | undefined]>([
      ["off", false],
      ["unset", undefined],
    ])("when the flag is %s", (_flag, isEnabled) => {
      it("does not tell Earn it opens stake positions natively", () => {
        const inputs = renderEarn({ isEnabled });

        expect(inputs).not.toHaveProperty(NATIVE_STAKE_POSITION_INPUT_KEY);
      });

      it.each<[string, string]>([
        ["claims", "true"],
        ["denies", "false"],
      ])("drops a route state that %s the capability", (_claim, value) => {
        const inputs = renderEarn({
          state: { [NATIVE_STAKE_POSITION_INPUT_KEY]: value, intent: "deposit" },
          isEnabled,
        });

        expect(inputs).not.toHaveProperty(NATIVE_STAKE_POSITION_INPUT_KEY);
        expect(inputs.intent).toBe("deposit");
        expect(JSON.parse(inputs.routerState ?? "")).toEqual({ intent: "deposit" });
      });

      it("does not tell it on the goToURL path", () => {
        const inputs = renderEarn({ state: { customDappUrl }, isEnabled });

        const query = goToURLQuery(inputs);
        expect(query.has(NATIVE_STAKE_POSITION_INPUT_KEY)).toBe(false);
        expect(query.get("accountId")).toBe("abc");
      });

      it("drops a route state that claims the capability on the goToURL path", () => {
        const inputs = renderEarn({
          state: { customDappUrl, [NATIVE_STAKE_POSITION_INPUT_KEY]: "true" },
          isEnabled,
        });

        expect(inputs).not.toHaveProperty(NATIVE_STAKE_POSITION_INPUT_KEY);
        expect(goToURLQuery(inputs).has(NATIVE_STAKE_POSITION_INPUT_KEY)).toBe(false);
      });
    });
  });

  it("passes uiVersion v3 when earn upselling is enabled", () => {
    render(<Earn />, {
      initialState: withFlagOverrides({
        ptxEarnLiveApp: { enabled: true, params: { manifest_id: "earn-manifest-id" } },
        ptxEarnUi: { enabled: true, params: { value: "v1" } },
        lwdWallet40: { enabled: true, params: { earnUpselling: true } as never },
        stakePrograms: { enabled: true, params: { list: [], redirects: {} } } as never,
      }),
    });

    const lastCall = mockWebPlatformPlayer.mock.calls.at(-1)?.[0] as unknown as {
      inputs: Record<string, string | undefined>;
    };

    expect(lastCall.inputs.uiVersion).toBe("v3");
    expect(lastCall.inputs.lw40enabled).toBe("true");
  });

  it("passes swapToEarn with enabled and params when the feature is enabled", () => {
    render(<Earn />, {
      initialState: withFlagOverrides({
        ptxEarnLiveApp: { enabled: true, params: { manifest_id: "earn-manifest-id" } },
        stakePrograms: { enabled: true, params: { list: [], redirects: {} } } as never,
        swapToEarn: { enabled: true, params: { foo: "bar" } } as never,
      }),
    });

    const lastCall = mockWebPlatformPlayer.mock.calls.at(-1)?.[0] as unknown as {
      inputs: Record<string, string | undefined>;
    };

    expect(lastCall.inputs.swapToEarn).toBe(
      JSON.stringify({ enabled: true, params: { foo: "bar" } }),
    );
  });

  it("passes swapToEarn with enabled=false and no params key when the feature is disabled", () => {
    render(<Earn />, {
      initialState: withFlagOverrides({
        ptxEarnLiveApp: { enabled: true, params: { manifest_id: "earn-manifest-id" } },
        stakePrograms: { enabled: true, params: { list: [], redirects: {} } } as never,
        swapToEarn: { enabled: false } as never,
      }),
    });

    const lastCall = mockWebPlatformPlayer.mock.calls.at(-1)?.[0] as unknown as {
      inputs: Record<string, string | undefined>;
    };

    expect(lastCall.inputs.swapToEarn).toBe(JSON.stringify({ enabled: false }));
  });

  it("passes stableSavings with enabled and params when the feature is enabled", () => {
    render(<Earn />, {
      initialState: withFlagOverrides({
        ptxEarnLiveApp: { enabled: true, params: { manifest_id: "earn-manifest-id" } },
        stakePrograms: { enabled: true, params: { list: [], redirects: {} } } as never,
        stableSavings: { enabled: true, params: { cohort: "a" } },
      }),
    });

    const lastCall = mockWebPlatformPlayer.mock.calls.at(-1)?.[0] as unknown as {
      inputs: Record<string, string | undefined>;
    };

    expect(lastCall.inputs.stableSavings).toBe(
      JSON.stringify({ enabled: true, params: { cohort: "a" } }),
    );
  });

  it("passes stableSavings with enabled=false and no params key when the feature is disabled", () => {
    render(<Earn />, {
      initialState: withFlagOverrides({
        ptxEarnLiveApp: { enabled: true, params: { manifest_id: "earn-manifest-id" } },
        stakePrograms: { enabled: true, params: { list: [], redirects: {} } } as never,
        stableSavings: { enabled: false },
      }),
    });

    const lastCall = mockWebPlatformPlayer.mock.calls.at(-1)?.[0] as unknown as {
      inputs: Record<string, string | undefined>;
    };

    expect(lastCall.inputs.stableSavings).toBe(JSON.stringify({ enabled: false }));
  });

  it("passes uiVersion v4 when earn simulator is enabled", () => {
    render(<Earn />, {
      initialState: withFlagOverrides({
        ptxEarnLiveApp: { enabled: true, params: { manifest_id: "earn-manifest-id" } },
        ptxEarnUi: { enabled: true, params: { value: "v1" } },
        lwdWallet40: { enabled: true, params: { earnSimulator: true } as never },
        stakePrograms: { enabled: true, params: { list: [], redirects: {} } } as never,
      }),
    });

    const lastCall = mockWebPlatformPlayer.mock.calls.at(-1)?.[0] as unknown as {
      inputs: Record<string, string | undefined>;
    };

    expect(lastCall.inputs.uiVersion).toBe("v4");
    expect(lastCall.inputs.lw40enabled).toBe("true");
  });
});
