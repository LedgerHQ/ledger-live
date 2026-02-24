/**
 * Integration tests: Release Notes and Terms of Use are deferred (not mounted)
 * when the Wallet V4 tour is active. MainAppLayout only mounts them when
 * useShouldShowDeferredModals is true (tour disabled or already seen at mount).
 *
 * Tests what the user sees: the Terms of Use modal is visible when tour is
 * disabled and not visible when tour is enabled (no mocking of modal components).
 */
import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { MainAppLayout } from "~/renderer/Default";
import ModalsLayer from "~/renderer/ModalsLayer";

jest.mock("electron-store", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ get: () => undefined, set: () => {} })),
}));
jest.mock("@braze/web-sdk", () => ({}));

jest.mock("~/renderer/bridge/SyncNewAccounts", () => ({
  SyncNewAccounts: () => <div data-testid="sync-new-accounts" />,
}));
jest.mock("~/renderer/components/Box/Box", () => ({
  __esModule: true,
  default: () => <div data-testid="main-layout-fallback" />,
}));
// Force the Box branch so we don't render the full wallet40 layout (which has more store deps).
jest.mock("LLD/components/Page/utils", () => ({
  ...jest.requireActual("LLD/components/Page/utils"),
  isWallet40Page: () => false,
}));

const tourEnabledState = {
  settings: {
    hasSeenWalletV4Tour: false,
    lastUsedVersion: "2.0.0",
    overriddenFeatureFlags: {
      lwdWallet40: { enabled: true, params: { tour: true } },
    },
  },
};

const tourDisabledState = {
  settings: {
    hasSeenWalletV4Tour: false,
    lastUsedVersion: "2.0.0",
    overriddenFeatureFlags: { lwdWallet40: { enabled: false } },
  },
};

const AppWithModals = () => (
  <>
    <MainAppLayout />
    {/* Modal component portals into #modals (see ~/renderer/components/Modal) */}
    <div id="modals" />
    <ModalsLayer />
  </>
);

describe("Wallet V4 Tour – deferred modals (Release Notes / Terms of Use)", () => {
  beforeEach(() => {
    global.localStorage.clear();
    global.localStorage.setItem("hasAnsweredLanguageAvailable", "2022-09-23");
  });

  it("shows Terms of Use modal when tour is disabled", async () => {
    // beforeEach cleared localStorage so terms are not accepted → modal opens when IsTermOfUseUpdated mounts
    render(<AppWithModals />, {
      initialRoute: "/",
      initialState: tourDisabledState,
    });

    // ModalsLayer uses Transition (100ms), wait for the modal content to be visible
    await waitFor(
      () => {
        expect(screen.getByTestId("terms-update-popup")).toBeInTheDocument();
      },
      { timeout: 500 },
    );
  });

  it("does not show Terms of Use modal when tour is enabled and not yet seen", () => {
    render(<AppWithModals />, {
      initialRoute: "/",
      initialState: tourEnabledState,
    });

    expect(screen.queryByTestId("terms-update-popup")).not.toBeInTheDocument();
  });
});
