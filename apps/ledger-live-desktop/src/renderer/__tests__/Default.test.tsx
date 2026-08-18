import React from "react";
import { FEATURE_FLAGS_DEFAULTS, FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { render, waitFor } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
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

jest.mock(
  "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase",
  () => ({
    PERPS_UI_USE_CASE: {
      legacy: "perpetuals",
      receive: "perpetuals:receive",
      fund: "perpetuals:fund",
    },
    getPerpsUiUseCase: () => undefined,
  }),
  { virtual: true },
);

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

  describe("analytics consent", () => {
    beforeEach(() => {
      (updateIdentify as jest.Mock).mockClear();
    });

    it("retains consent flags on mount (test regression for LIVE-30334)", async () => {
      const { store, unmount } = render(<Default />, {
        initialState: {
          devices: { currentDevice: null, devices: [] },
          featureFlags: (() => {
            const overrides = {
              ...FEATURE_FLAGS_INITIAL_STATE.overrides,
              lldAnalyticsOptInPrompt: {
                ...(FEATURE_FLAGS_INITIAL_STATE.overrides.lldAnalyticsOptInPrompt ?? {}),
                enabled: true,
                params: { variant: "A", entryPoints: ["Portfolio"] },
              },
            };
            return {
              ...FEATURE_FLAGS_INITIAL_STATE,
              overrides,
              // Mirror slice resolution so hooks reading from `resolved` see the override.
              resolved: { ...FEATURE_FLAGS_DEFAULTS, ...overrides },
            };
          })(),
          settings: {
            ...INITIAL_STATE,
            loaded: true,
            hasCompletedOnboarding: true,
            hasSeenAnalyticsOptInPrompt: false,
            shareAnalytics: true,
            sharePersonalizedRecommandations: true,
          },
        },
        initialRoute: "/",
      });

      await waitFor(() => {
        expect(updateIdentify).toHaveBeenCalled();
      });

      expect(store.getState().settings.shareAnalytics).toBe(true);
      expect(store.getState().settings.sharePersonalizedRecommandations).toBe(true);
      unmount();
    });
  });
});
