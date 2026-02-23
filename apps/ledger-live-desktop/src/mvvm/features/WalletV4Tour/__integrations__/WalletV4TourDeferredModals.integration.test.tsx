/**
 * Integration tests: Release Notes and Terms of Use are deferred (not mounted)
 * when the Wallet V4 tour is active. MainAppLayout only mounts them when
 * useShouldShowDeferredModals is true (tour disabled or already seen at mount).
 *
 * Mocks are scoped to this file so WalletV4TourDrawer.integration.test.tsx
 * keeps using the real useWalletFeaturesConfig.
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { MainAppLayout } from "~/renderer/Default";

jest.mock("electron-store", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ get: () => undefined, set: () => {} })),
}));
jest.mock("@braze/web-sdk", () => ({}));

const mockUseWalletFeaturesConfig = jest.fn();
jest.mock("@ledgerhq/live-common/featureFlags/walletFeaturesConfig/useWalletFeaturesConfig", () => ({
  useWalletFeaturesConfig: (...args: unknown[]) => mockUseWalletFeaturesConfig(...args),
}));
jest.mock("~/renderer/bridge/SyncNewAccounts", () => ({
  SyncNewAccounts: () => <div data-testid="sync-new-accounts" />,
}));
jest.mock("~/renderer/components/IsNewVersion", () => ({
  __esModule: true,
  default: () => <div data-testid="is-new-version" />,
}));
jest.mock("~/renderer/components/IsSystemLanguageAvailable", () => ({
  __esModule: true,
  default: () => <div data-testid="is-system-language-available" />,
}));
jest.mock("~/renderer/components/IsTermOfUseUpdated", () => ({
  __esModule: true,
  default: () => <div data-testid="is-term-of-use-updated" />,
}));
jest.mock("~/renderer/components/Box/Box", () => ({
  __esModule: true,
  default: () => <div data-testid="main-layout-fallback" />,
}));

const baseWalletConfig = {
  shouldDisplayMarketBanner: false,
  isEnabled: false,
  shouldDisplayWallet40MainNav: false,
};

const tourEnabledState = {
  settings: {
    hasSeenWalletV4Tour: false,
    overriddenFeatureFlags: {
      lwdWallet40: { enabled: true, params: { tour: true } },
    },
  },
};

const tourDisabledState = {
  settings: {
    hasSeenWalletV4Tour: false,
    overriddenFeatureFlags: { lwdWallet40: { enabled: false } },
  },
};

describe("Wallet V4 Tour – deferred modals (Release Notes / Terms of Use)", () => {
  it("renders Release Notes and Terms of Use when tour is disabled", () => {
    mockUseWalletFeaturesConfig.mockReturnValue({
      ...baseWalletConfig,
      shouldDisplayTour: false,
    });
    render(<MainAppLayout />, {
      initialRoute: "/",
      initialState: tourDisabledState,
    });

    expect(screen.getByTestId("is-new-version")).toBeInTheDocument();
    expect(screen.getByTestId("is-system-language-available")).toBeInTheDocument();
    expect(screen.getByTestId("is-term-of-use-updated")).toBeInTheDocument();
    expect(screen.getByTestId("sync-new-accounts")).toBeInTheDocument();
  });

  it("does not render Release Notes nor Terms of Use when tour is enabled and not yet seen", () => {
    mockUseWalletFeaturesConfig.mockReturnValue({
      ...baseWalletConfig,
      shouldDisplayTour: true,
    });
    render(<MainAppLayout />, {
      initialRoute: "/",
      initialState: tourEnabledState,
    });

    expect(screen.queryByTestId("is-new-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("is-system-language-available")).not.toBeInTheDocument();
    expect(screen.queryByTestId("is-term-of-use-updated")).not.toBeInTheDocument();
    expect(screen.getByTestId("sync-new-accounts")).toBeInTheDocument();
  });
});
