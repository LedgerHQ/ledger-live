import React from "react";
import { act, render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { useShouldShowDeferredModals } from "~/renderer/hooks/useShouldShowDeferredModals";
import IsTermOfUseUpdated from "~/renderer/components/IsTermOfUseUpdated";
import ModalsLayer from "~/renderer/ModalsLayer";
import { setHasSeenQ3Tour } from "~/renderer/actions/settings";

const baseSettings = {
  lastUsedVersion: "2.0.0",
  devicesModelList: [],
  orderAccounts: "balance|desc",
  hasCompletedOnboarding: true,
};

const q3TourEnabledState = {
  ...withFlagOverrides({
    lwdWallet40: { enabled: true, params: { tour: false } },
    releaseTour: { enabled: true, params: { variant: "q3_a" } },
  }),
  settings: {
    ...baseSettings,
    hasSeenQ3Tour: false,
  },
};

const q3TourDisabledState = {
  ...withFlagOverrides({
    lwdWallet40: { enabled: true, params: { tour: false } },
    releaseTour: { enabled: false, params: { variant: "q3_a" } },
  }),
  settings: {
    ...baseSettings,
    hasSeenQ3Tour: false,
  },
};

const q3TourEnabledAlreadySeenState = {
  ...withFlagOverrides({
    lwdWallet40: { enabled: true, params: { tour: false } },
    releaseTour: { enabled: true, params: { variant: "q3_a" } },
  }),
  settings: {
    ...baseSettings,
    hasSeenQ3Tour: true,
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

describe("Q3 Tour – deferred modals (Release Notes / Terms of Use)", () => {
  beforeEach(() => {
    global.localStorage.clear();
    global.localStorage.setItem("hasAnsweredLanguageAvailable", "2022-09-23");
  });

  it("shows Terms of Use modal when Q3 tour is disabled", async () => {
    render(<AppWithModals />, {
      initialRoute: "/",
      initialState: q3TourDisabledState,
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("terms-update-popup")).toBeVisible();
      },
      { timeout: 500 },
    );
  });

  it("does not show Terms of Use modal when Q3 tour is enabled and not yet seen", () => {
    render(<AppWithModals />, {
      initialRoute: "/",
      initialState: q3TourEnabledState,
    });

    expect(screen.queryByTestId("terms-update-popup")).not.toBeInTheDocument();
  });

  it("shows Terms of Use modal when Q3 tour is enabled but user had already seen tour at mount", async () => {
    render(<AppWithModals />, {
      initialRoute: "/",
      initialState: q3TourEnabledAlreadySeenState,
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("terms-update-popup")).toBeVisible();
      },
      { timeout: 500 },
    );
  });

  it("does not show Terms of Use modal after user closes Q3 tour in same session (deferred modals stay hidden)", () => {
    const { store } = render(<AppWithModals />, {
      initialRoute: "/",
      initialState: q3TourEnabledState,
    });

    expect(screen.queryByTestId("terms-update-popup")).not.toBeInTheDocument();

    act(() => {
      store.dispatch(setHasSeenQ3Tour(true));
    });

    expect(screen.queryByTestId("terms-update-popup")).not.toBeInTheDocument();
  });
});
