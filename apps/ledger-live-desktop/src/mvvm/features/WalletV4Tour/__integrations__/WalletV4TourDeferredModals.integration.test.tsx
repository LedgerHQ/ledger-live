/**
 * Integration tests: useShouldShowDeferredModals gates the deferred modals
 * (IsNewVersion, IsSystemLanguageAvailable, IsTermOfUseUpdated) in Default.tsx.
 * When the tour is active and not yet seen, they are not mounted; when tour is off
 * or already seen at mount, they are. We assert via IsTermOfUseUpdated / Terms modal.
 * Minimal layout to avoid Default’s asset-aggregation and families chain.
 */
import React from "react";
import { act, render, screen, waitFor } from "tests/testSetup";
import { useShouldShowDeferredModals } from "~/renderer/hooks/useShouldShowDeferredModals";
import IsTermOfUseUpdated from "~/renderer/components/IsTermOfUseUpdated";
import ModalsLayer from "~/renderer/ModalsLayer";
import { setHasSeenWalletV4Tour } from "~/renderer/actions/settings";

jest.mock("~/renderer/store", () => ({}));
jest.mock("@braze/web-sdk", () => ({}));
// Only load TermOfUseUpdate modal to avoid ModularDrawer/families/asset-aggregation chain
jest.mock("~/renderer/modals", () => {
  const TermOfUseUpdate = require("~/renderer/modals/TermOfUseUpdate").default;
  return {
    __esModule: true,
    default: { MODAL_TERM_OF_USE_UPDATE: TermOfUseUpdate },
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

/** Tour enabled but user had already seen it at app mount → deferred modals are shown */
const tourEnabledAlreadySeenState = {
  settings: {
    ...baseSettings,
    hasSeenWalletV4Tour: true,
    overriddenFeatureFlags: {
      lwdWallet40: { enabled: true, params: { tour: true } },
    },
  },
};

/** Same gate as Default.tsx: shouldShowDeferredModals controls mounting of IsNewVersion, IsSystemLanguageAvailable, IsTermOfUseUpdated. We only mount IsTermOfUseUpdated here and assert on Terms modal. */
function DeferredModalsLayout() {
  const shouldShowDeferredModals = useShouldShowDeferredModals();
  return <>{shouldShowDeferredModals && <IsTermOfUseUpdated />}</>;
}

const AppWithModals = () => (
  <>
    <DeferredModalsLayout />
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

  it("shows Terms of Use modal when tour is enabled but user had already seen tour at mount", async () => {
    render(<AppWithModals />, {
      initialRoute: "/",
      initialState: tourEnabledAlreadySeenState,
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("terms-update-popup")).toBeInTheDocument();
      },
      { timeout: 500 },
    );
  });

  it("does not show Terms of Use modal after user closes tour in same session (deferred modals stay hidden)", () => {
    const { store } = render(<AppWithModals />, {
      initialRoute: "/",
      initialState: tourEnabledState,
    });

    expect(screen.queryByTestId("terms-update-popup")).not.toBeInTheDocument();

    act(() => {
      store.dispatch(setHasSeenWalletV4Tour(true));
    });

    expect(screen.queryByTestId("terms-update-popup")).not.toBeInTheDocument();
  });
});
