import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { MainAppLayout } from "./Default";

// Avoid loading electron-store (used by store.ts)
jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
}));

jest.mock("electron", () => ({ ipcRenderer: { send: jest.fn() } }));
jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
  useTrack: jest.fn(() => jest.fn()),
}));
jest.mock("~/renderer/screens/platform", () => ({ LiveApp: () => null }));
jest.mock("~/renderer/hooks/useNotifications", () => ({
  useNotifications: () => ({ notificationsCards: [], groupNotifications: jest.fn(), onClickNotif: jest.fn() }),
}));
jest.mock("@braze/web-sdk", () => ({ getCachedContentCards: () => ({ cards: [] }) }));
jest.mock("~/renderer/screens/dashboard", () => ({ __esModule: true, default: () => null }));
// Page uses usePageViewModel which calls scrollTo on a ref; jsdom divs don't have scrollTo
jest.mock("LLD/components/Page", () => {
  const React = require("react");
  return { __esModule: true, default: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children) };
});

const wallet40TourFlags = {
  lwdWallet40: { enabled: true, params: { tour: true, mainNavigation: true, marketBanner: true } },
};

const defaultSettings = {
  vaultSigner: { enabled: false, host: "", token: "", workspace: "" },
  devicesModelList: [],
  orderAccounts: "balance|desc",
  lastUsedVersion: "2.0.0", // IsNewVersion expects a string (jest sets __APP_VERSION__ to 2.0.0)
};

function getInitialState(settingsOverrides: Record<string, unknown>) {
  return { settings: { ...defaultSettings, ...settingsOverrides } };
}

describe("MainAppLayout", () => {
  it("shows Wallet V4 Tour dialog on Portfolio when tour enabled and not seen", async () => {
    render(<MainAppLayout />, {
      initialRoute: "/",
      initialState: getInitialState({
        hasSeenWalletV4Tour: false,
        overriddenFeatureFlags: wallet40TourFlags,
      }),
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /wallet v4 tour/i })).toBeInTheDocument();
    });
  });

  it("does not show Wallet V4 Tour dialog on non-Portfolio route", async () => {
    render(<MainAppLayout />, {
      initialRoute: "/settings",
      initialState: getInitialState({
        hasSeenWalletV4Tour: false,
        overriddenFeatureFlags: wallet40TourFlags,
      }),
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /wallet v4 tour/i })).not.toBeInTheDocument();
    });
  });

  it("does not show Wallet V4 Tour when already seen", async () => {
    render(<MainAppLayout />, {
      initialRoute: "/",
      initialState: getInitialState({
        hasSeenWalletV4Tour: true,
        overriddenFeatureFlags: wallet40TourFlags,
      }),
    });

    expect(screen.queryByRole("dialog", { name: /wallet v4 tour/i })).not.toBeInTheDocument();
  });
});
