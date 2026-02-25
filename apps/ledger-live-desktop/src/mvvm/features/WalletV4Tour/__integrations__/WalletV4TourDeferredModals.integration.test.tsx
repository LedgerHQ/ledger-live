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

jest.mock("~/renderer/store", () => ({}));
jest.mock("@braze/web-sdk", () => ({
  getCachedContentCards: jest.fn(() => ({})),
}));

jest.mock("~/renderer/bridge/SyncNewAccounts", () => ({
  SyncNewAccounts: () => <div data-testid="sync-new-accounts" />,
}));
// Avoid scrollTo in jsdom (Page uses scrollTo on ref which is not implemented in test env)
jest.mock("LLD/components/Page", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});
// Test in Wallet V4 layout (route "/" with lwdWallet40 enabled uses the V4 branch in MainAppLayout).
// Include vaultSigner and devicesModelList so selectors used by the full layout (LiveAppDrawer, NotificationIndicator) don't crash.
const vaultSigner = { enabled: false, host: "", token: "", workspace: "" };
const baseSettings = {
  hasSeenWalletV4Tour: false,
  lastUsedVersion: "2.0.0",
  vaultSigner,
  devicesModelList: [],
  orderAccounts: "balance|desc",
};

const tourEnabledState = {
  settings: {
    ...baseSettings,
    overriddenFeatureFlags: {
      lwdWallet40: { enabled: true, params: { tour: true } },
    },
  },
};

const tourDisabledState = {
  settings: {
    ...baseSettings,
    overriddenFeatureFlags: {
      lwdWallet40: { enabled: true, params: { tour: false } },
    },
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
