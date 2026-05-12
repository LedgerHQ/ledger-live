import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
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

  it("passes fallback uiVersion and lw40enabled=false when feature is disabled", () => {
    render(<Earn />, {
      initialState: withFlagOverrides({
        ptxEarnLiveApp: { enabled: true, params: { manifest_id: "earn-manifest-id" } },
        ptxEarnUi: { enabled: true, params: { value: "v2" } },
        lwdWallet40: { enabled: false },
        stakePrograms: {
          enabled: true,
          params: { list: [], redirects: {} },
        } as never,
      }),
    });

    expect(mockWebPlatformPlayer).toHaveBeenCalled();
    const lastCall = mockWebPlatformPlayer.mock.calls.at(-1)?.[0] as unknown as {
      inputs: Record<string, string | undefined>;
    };

    expect(lastCall.inputs.uiVersion).toBe("v1");
    expect(lastCall.inputs.lw40enabled).toBe("false");
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
