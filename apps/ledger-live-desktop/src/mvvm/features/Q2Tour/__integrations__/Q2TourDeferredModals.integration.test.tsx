/**
 * Integration tests: useShouldShowDeferredModals gates deferred modals when Q2 Tour
 * is active and not yet seen at mount.
 */
import React from "react";
import { act, render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { useShouldShowDeferredModals } from "~/renderer/hooks/useShouldShowDeferredModals";
import IsTermOfUseUpdated from "~/renderer/components/IsTermOfUseUpdated";
import ModalsLayer from "~/renderer/ModalsLayer";
import { setHasSeenQ2Tour } from "~/renderer/actions/settings";

const vaultSigner = { enabled: false, host: "", token: "", workspace: "" };
const baseSettings = {
  lastUsedVersion: "2.0.0",
  vaultSigner,
  devicesModelList: [],
  orderAccounts: "balance|desc",
  hasCompletedOnboarding: true,
};

const q2TourEnabledState = {
  ...withFlagOverrides({
    lwdWallet40: { enabled: true, params: { q2Tour: true, tour: false } },
  }),
  settings: {
    ...baseSettings,
    hasSeenQ2Tour: false,
  },
};

const q2TourDisabledState = {
  ...withFlagOverrides({
    lwdWallet40: { enabled: true, params: { q2Tour: false, tour: false } },
  }),
  settings: {
    ...baseSettings,
    hasSeenQ2Tour: false,
  },
};

const q2TourEnabledAlreadySeenState = {
  ...withFlagOverrides({
    lwdWallet40: { enabled: true, params: { q2Tour: true, tour: false } },
  }),
  settings: {
    ...baseSettings,
    hasSeenQ2Tour: true,
  },
};

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

describe("Q2 Tour – deferred modals (Release Notes / Terms of Use)", () => {
  beforeEach(() => {
    global.localStorage.clear();
    global.localStorage.setItem("hasAnsweredLanguageAvailable", "2022-09-23");
  });

  it("shows Terms of Use modal when Q2 tour is disabled", async () => {
    render(<AppWithModals />, {
      initialRoute: "/",
      initialState: q2TourDisabledState,
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("terms-update-popup")).toBeVisible();
      },
      { timeout: 500 },
    );
  });

  it("does not show Terms of Use modal when Q2 tour is enabled and not yet seen", () => {
    render(<AppWithModals />, {
      initialRoute: "/",
      initialState: q2TourEnabledState,
    });

    expect(screen.queryByTestId("terms-update-popup")).not.toBeInTheDocument();
  });

  it("shows Terms of Use modal when Q2 tour is enabled but user had already seen tour at mount", async () => {
    render(<AppWithModals />, {
      initialRoute: "/",
      initialState: q2TourEnabledAlreadySeenState,
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("terms-update-popup")).toBeVisible();
      },
      { timeout: 500 },
    );
  });

  it("does not show Terms of Use modal after user closes Q2 tour in same session (deferred modals stay hidden)", () => {
    const { store } = render(<AppWithModals />, {
      initialRoute: "/",
      initialState: q2TourEnabledState,
    });

    expect(screen.queryByTestId("terms-update-popup")).not.toBeInTheDocument();

    act(() => {
      store.dispatch(setHasSeenQ2Tour(true));
    });

    expect(screen.queryByTestId("terms-update-popup")).not.toBeInTheDocument();
  });
});
