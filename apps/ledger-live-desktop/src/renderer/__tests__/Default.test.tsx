import React from "react";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import Default from "../Default";
import { updateIdentify } from "../analytics/segment";

jest.mock("electron", () => {
  const base = jest.requireActual<typeof import("../../../tests/mocks/electron")>(
    "../../../tests/mocks/electron",
  );
  return {
    ipcRenderer: {
      ...base.ipcRenderer,
      removeListener: jest.fn(),
    },
  };
});

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
}));

jest.mock("@braze/web-sdk", () => ({
  getCachedContentCards: () => ({ cards: [] }),
}));

jest.mock("LLD/features/AppBlockers/components/AppVersionBlocker", () => {
  const React = require("react");
  return { AppVersionBlocker: ({ children }: { children: React.ReactNode }) => <>{children}</> };
});

jest.mock("../analytics/segment", () => ({
  ...jest.requireActual("../analytics/segment"),
  updateIdentify: jest.fn(),
  startAnalytics: jest.fn(),
}));

describe("Default", () => {
  beforeAll(() => {
    Element.prototype.scrollTo = jest.fn();
  });

  afterAll(() => {
    delete (Element.prototype as { scrollTo?: unknown }).scrollTo;
  });

  it("renders FirmwareUpdateBannerEntry in main layout when shouldDisplayWallet40MainNav is false", async () => {
    render(<Default />, {
      initialState: {
        ...withFlagOverrides({ lwdWallet40: { enabled: false } }),
        devices: { currentDevice: null, devices: [] },
        settings: {
          loaded: true,
          hasCompletedOnboarding: true,
          lastUsedVersion: __APP_VERSION__,
          vaultSigner: { enabled: false, host: "", token: "", workspace: "" },
          devicesModelList: [],
          anonymousUserNotifications: {},
          orderAccounts: "balance|desc",
          latestFirmware: { final: { name: "2.3.0" } },
        },
      },
      initialRoute: "/",
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("fw-update-banner")).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  }, 15000);

  describe("analytics consent", () => {
    beforeEach(() => {
      (updateIdentify as jest.Mock).mockClear();
    });

    it("retains consent flags on mount (test regression for LIVE-30334)", async () => {
      const { store } = render(<Default />, {
        initialState: {
          devices: { currentDevice: null, devices: [] },
          featureFlags: {
            ...FEATURE_FLAGS_INITIAL_STATE,
            overrides: {
              ...FEATURE_FLAGS_INITIAL_STATE.overrides,
              lldAnalyticsOptInPrompt: {
                ...(FEATURE_FLAGS_INITIAL_STATE.overrides.lldAnalyticsOptInPrompt ?? {}),
                enabled: true,
                params: { variant: "A", entryPoints: ["Portfolio"] },
              },
            },
          },
          settings: {
            loaded: true,
            hasCompletedOnboarding: true,
            hasSeenAnalyticsOptInPrompt: false,
            shareAnalytics: true,
            sharePersonalizedRecommandations: true,
            lastUsedVersion: __APP_VERSION__,
            vaultSigner: { enabled: false, host: "", token: "", workspace: "" },
            devicesModelList: [],
            anonymousUserNotifications: {},
            orderAccounts: "balance|desc",
          },
        },
        initialRoute: "/",
      });

      await waitFor(() => {
        expect(updateIdentify).toHaveBeenCalled();
      });

      expect(store.getState().settings.shareAnalytics).toBe(true);
      expect(store.getState().settings.sharePersonalizedRecommandations).toBe(true);
    });
  });
});
