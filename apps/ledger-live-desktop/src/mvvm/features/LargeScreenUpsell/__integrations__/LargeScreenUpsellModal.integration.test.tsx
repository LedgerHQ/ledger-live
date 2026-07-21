import React, { useState } from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  withFlagOverrides,
  type DeepPartial,
} from "tests/testSetup";
import type { State } from "~/renderer/reducers";
import { closeDialog, openDialog } from "~/renderer/reducers/dialogs";
import { openURL } from "~/renderer/linking";
import { track, trackPage } from "~/renderer/analytics/segment";
import { LargeScreenUpsellModalMount } from "..";

/** Mimics Portfolio scoping: Mount unmounts when leaving portfolio. */
function LargeScreenUpsellModalMountOnPortfolio() {
  const [onPortfolio, setOnPortfolio] = useState(true);

  return (
    <>
      <button type="button" onClick={() => setOnPortfolio(true)}>
        go-portfolio
      </button>
      <button type="button" onClick={() => setOnPortfolio(false)}>
        go-qa
      </button>
      {onPortfolio ? <LargeScreenUpsellModalMount /> : null}
    </>
  );
}

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const NANO_S_OPTED_OUT_ANALYTICS_PROPS = {
  deviceModel: "lns",
  personalRecoOptIn: false,
  offerType: "none",
  platform: "lwd",
  retriesUpsellModal: 0,
  throttled: false,
};

const NANO_S_OPTED_IN_ANALYTICS_PROPS = {
  ...NANO_S_OPTED_OUT_ANALYTICS_PROPS,
  personalRecoOptIn: true,
  offerType: "discount",
};

const NOW = new Date("2026-07-15T12:00:00.000Z");

function eligibleState(settingsOverrides: Partial<State["settings"]> = {}): DeepPartial<State> {
  return {
    ...withFlagOverrides({
      largeScreenUpsell: { enabled: true },
      lwdWallet40: { enabled: true, params: { tour: false } },
    }),
    settings: {
      hasCompletedOnboarding: true,
      hasSeenWalletV4Tour: true,
      hasSeenQ2Tour: true,
      sharePersonalizedRecommandations: false,
      devicesModelList: [DeviceModelId.nanoS],
      ...settingsOverrides,
    },
    postOnboarding: {
      onboardingDate: "2026-01-01T00:00:00.000Z",
    },
    largeScreenUpsellModal: {
      retries: 0,
      lastSeenAt: null,
      session: "ready",
    },
    dialogs: {
      GENERIC_AWARENESS_MODAL: false,
    },
  };
}

describe("LargeScreenUpsellModalMount (integration)", () => {
  beforeEach(() => {
    jest.mocked(openURL).mockClear();
    jest.mocked(track).mockClear();
    jest.mocked(trackPage).mockClear();
    jest
      .useFakeTimers({
        doNotFake: [
          "setImmediate",
          "clearImmediate",
          "nextTick",
          "queueMicrotask",
          "requestAnimationFrame",
          "cancelAnimationFrame",
          "performance",
        ],
      })
      .setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderMount = (
    initialState: DeepPartial<State> = eligibleState(),
    initialRoute?: string,
    ui: React.ReactElement = <LargeScreenUpsellModalMount />,
  ) =>
    render(ui, {
      initialState,
      initialRoute,
      userEventOptions: {
        advanceTimers: jest.advanceTimersByTime,
      },
    });

  const expectModalNotOpen = async () => {
    // Modal open is deferred to a ViewModel useEffect; flush it before asserting absence.
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByTestId("large-screen-upsell-modal")).not.toBeInTheDocument();
  };

  it("should not re-open after dismiss when remounting on portfolio return", async () => {
    const { user, store } = renderMount(
      eligibleState(),
      "/",
      <LargeScreenUpsellModalMountOnPortfolio />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("large-screen-upsell-modal")).toBeVisible();
    });

    await user.click(screen.getByLabelText("components.dialogHeader.closeAriaLabel"));

    await waitFor(() => {
      expect(screen.queryByTestId("large-screen-upsell-modal")).not.toBeInTheDocument();
    });
    expect(store.getState().largeScreenUpsellModal.session).toBe("dismissed");

    await user.click(screen.getByRole("button", { name: "go-qa" }));

    expect(screen.queryByTestId("large-screen-upsell-modal")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "go-portfolio" }));

    await expectModalNotOpen();

    expect(
      jest.mocked(trackPage).mock.calls.filter(([page]) => page === "Modal - Upgrade"),
    ).toHaveLength(1);
  });

  it("should open with opted-out copy when personalized recommendations are off", async () => {
    renderMount();

    await waitFor(() => {
      expect(screen.getByTestId("large-screen-upsell-modal")).toBeVisible();
    });

    expect(screen.getByText("Spot scams. See every detail")).toBeVisible();
    expect(
      screen.getByText(
        "Review clearly on a touchscreen signer and spot scams with advanced security checks.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Explore touchscreen signers" })).toBeVisible();
    expect(trackPage).toHaveBeenCalledWith(
      "Modal - Upgrade",
      undefined,
      {
        name: "Modal - Upgrade",
        sourceFlow: "app start",
        modalFrequencyState: "every start",
        ...NANO_S_OPTED_OUT_ANALYTICS_PROPS,
      },
      true,
      false,
    );
  });

  it("should open with opted-in copy when personalized recommendations are on", async () => {
    renderMount(
      eligibleState({
        sharePersonalizedRecommandations: true,
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("large-screen-upsell-modal")).toBeVisible();
    });

    expect(screen.getByText("See more. Tap less. Save 20%")).toBeVisible();
    expect(
      screen.getByText(
        "Enjoy a larger screen, smarter transaction reviews, enhanced protection, and an exclusive 20% off.",
      ),
    ).toBeVisible();
    expect(trackPage).toHaveBeenCalledWith(
      "Modal - Upgrade",
      undefined,
      {
        name: "Modal - Upgrade",
        sourceFlow: "app start",
        modalFrequencyState: "every start",
        ...NANO_S_OPTED_IN_ANALYTICS_PROPS,
      },
      true,
      false,
    );
  });

  it("should open the opted-out shop link with desktop UTMs when the CTA is pressed", async () => {
    const { store, user } = renderMount({
      ...eligibleState(),
      ...withFlagOverrides({
        largeScreenUpsell: {
          enabled: true,
          params: {
            opted_in: { link: "https://shop.ledger.com/pages/opted-in-offer" },
            opted_out: { link: "https://shop.ledger.com/pages/opted-out-offer" },
          },
        },
        lwdWallet40: { enabled: true, params: { tour: false } },
      }),
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Explore touchscreen signers" })).toBeVisible();
    });

    await user.click(screen.getByRole("button", { name: "Explore touchscreen signers" }));

    await waitFor(() => {
      expect(screen.queryByTestId("large-screen-upsell-modal")).not.toBeInTheDocument();
    });

    expect(openURL).toHaveBeenCalledTimes(1);
    const openedUrl = new URL(String(jest.mocked(openURL).mock.calls[0]?.[0]));
    expect(openedUrl.origin + openedUrl.pathname).toBe(
      "https://shop.ledger.com/pages/opted-out-offer",
    );
    expect(openedUrl.searchParams.get("utm_source")).toBe("ledger_live");
    expect(openedUrl.searchParams.get("utm_medium")).toBe("desktop");
    expect(openedUrl.searchParams.get("utm_campaign")).toBe("upsell_large_screen");
    expect(openedUrl.searchParams.get("utm_content")).toBe("app_start_modal");
    expect(store.getState().largeScreenUpsellModal.retries).toBe(0);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "explore large screen devices",
      page: "Modal - Upgrade",
      ...NANO_S_OPTED_OUT_ANALYTICS_PROPS,
    });
    expect(track).not.toHaveBeenCalledWith("modal_dismissed", expect.anything());
  });

  it("should open the opted-in shop link with desktop UTMs when the CTA is pressed", async () => {
    const { user } = renderMount({
      ...eligibleState({
        sharePersonalizedRecommandations: true,
      }),
      ...withFlagOverrides({
        largeScreenUpsell: {
          enabled: true,
          params: {
            opted_in: { link: "https://shop.ledger.com/pages/opted-in-offer" },
            opted_out: { link: "https://shop.ledger.com/pages/opted-out-offer" },
          },
        },
        lwdWallet40: { enabled: true, params: { tour: false } },
      }),
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Explore touchscreen signers" })).toBeVisible();
    });

    await user.click(screen.getByRole("button", { name: "Explore touchscreen signers" }));

    await waitFor(() => {
      expect(screen.queryByTestId("large-screen-upsell-modal")).not.toBeInTheDocument();
    });

    expect(openURL).toHaveBeenCalledTimes(1);
    const openedUrl = new URL(String(jest.mocked(openURL).mock.calls[0]?.[0]));
    expect(openedUrl.origin + openedUrl.pathname).toBe(
      "https://shop.ledger.com/pages/opted-in-offer",
    );
    expect(openedUrl.searchParams.get("utm_source")).toBe("ledger_live");
    expect(openedUrl.searchParams.get("utm_medium")).toBe("desktop");
    expect(openedUrl.searchParams.get("utm_campaign")).toBe("upsell_large_screen");
    expect(openedUrl.searchParams.get("utm_content")).toBe("app_start_modal");
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "explore large screen devices",
      page: "Modal - Upgrade",
      ...NANO_S_OPTED_IN_ANALYTICS_PROPS,
    });
  });

  it("should increment retries and set lastSeenAt when the modal opens without dismissing session", async () => {
    const { store } = renderMount();

    await waitFor(() => {
      expect(screen.getByTestId("large-screen-upsell-modal")).toBeVisible();
    });

    await waitFor(() => {
      expect(store.getState().largeScreenUpsellModal.retries).toBe(1);
      expect(store.getState().largeScreenUpsellModal.lastSeenAt).not.toBeNull();
    });
    expect(store.getState().largeScreenUpsellModal.session).toBe("ready");
  });

  it("should close when the header close control is pressed and stay closed", async () => {
    const { store, user, i18n } = renderMount();

    await waitFor(() => {
      expect(screen.getByTestId("large-screen-upsell-modal")).toBeVisible();
    });

    await waitFor(() => {
      expect(store.getState().largeScreenUpsellModal.retries).toBe(1);
    });
    expect(store.getState().largeScreenUpsellModal.session).toBe("ready");

    await user.click(screen.getByLabelText(i18n.t("components.dialogHeader.closeAriaLabel")));

    await waitFor(() => {
      expect(screen.queryByTestId("large-screen-upsell-modal")).not.toBeInTheDocument();
    });

    expect(openURL).not.toHaveBeenCalled();
    expect(store.getState().largeScreenUpsellModal.retries).toBe(1);
    expect(store.getState().largeScreenUpsellModal.session).toBe("dismissed");
    expect(screen.queryByTestId("large-screen-upsell-modal")).not.toBeInTheDocument();
    expect(track).toHaveBeenCalledWith("modal_dismissed", {
      modal: "upgrade modal",
      page: "Modal - Upgrade",
      dismissMethod: "close button",
      ...NANO_S_OPTED_OUT_ANALYTICS_PROPS,
    });
    expect(
      jest.mocked(track).mock.calls.filter(([event]) => event === "modal_dismissed"),
    ).toHaveLength(1);
  });

  it("should close and reset retries without opening a URL when the CTA link is empty", async () => {
    const { store, user } = renderMount({
      ...eligibleState(),
      ...withFlagOverrides({
        largeScreenUpsell: {
          enabled: true,
          params: {
            opted_out: { link: "   " },
          },
        },
        lwdWallet40: { enabled: true, params: { tour: false } },
      }),
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Explore touchscreen signers" })).toBeVisible();
    });

    await waitFor(() => {
      expect(store.getState().largeScreenUpsellModal.retries).toBe(1);
    });

    await user.click(screen.getByRole("button", { name: "Explore touchscreen signers" }));

    await waitFor(() => {
      expect(screen.queryByTestId("large-screen-upsell-modal")).not.toBeInTheDocument();
    });

    expect(openURL).not.toHaveBeenCalled();
    expect(store.getState().largeScreenUpsellModal.retries).toBe(0);
  });

  it("should open for nanoS even when onboarding was recent because nanoS cooldown is 0", async () => {
    renderMount({
      ...eligibleState({
        devicesModelList: [DeviceModelId.nanoS],
      }),
      postOnboarding: {
        onboardingDate: "2026-07-14T12:00:00.000Z",
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId("large-screen-upsell-modal")).toBeVisible();
    });
  });

  it("should open when retries are below killThreshold 3 even if lastSeenAt is recent", async () => {
    renderMount({
      ...eligibleState(),
      ...withFlagOverrides({
        largeScreenUpsell: {
          enabled: true,
          params: {
            modal: { enabled: true, killThreshold: 3, cadenceDays: 30 },
          },
        },
        lwdWallet40: { enabled: true, params: { tour: false } },
      }),
      largeScreenUpsellModal: {
        retries: 2,
        lastSeenAt: Date.parse("2026-07-14T12:00:00.000Z"),
        session: "ready",
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId("large-screen-upsell-modal")).toBeVisible();
    });

    expect(trackPage).toHaveBeenCalledWith(
      "Modal - Upgrade",
      undefined,
      expect.objectContaining({
        retriesUpsellModal: 2,
        throttled: false,
      }),
      true,
      false,
    );
  });

  it("should render opted-in copy with the configured discount", async () => {
    renderMount({
      ...eligibleState({
        sharePersonalizedRecommandations: true,
      }),
      ...withFlagOverrides({
        largeScreenUpsell: {
          enabled: true,
          params: {
            discount: 0.3,
          },
        },
        lwdWallet40: { enabled: true, params: { tour: false } },
      }),
    });

    await waitFor(() => {
      expect(screen.getByText("See more. Tap less. Save 30%")).toBeVisible();
    });
  });

  it("should not open when a touchscreen device has been seen", async () => {
    renderMount(
      eligibleState({
        devicesModelList: [DeviceModelId.nanoS, DeviceModelId.stax],
      }),
    );

    await expectModalNotOpen();
  });

  it("should not open when only a touchscreen device has been seen", async () => {
    renderMount(
      eligibleState({
        devicesModelList: [DeviceModelId.stax],
      }),
    );

    await expectModalNotOpen();
  });

  it("should not open when no nano device has been seen", async () => {
    renderMount(
      eligibleState({
        devicesModelList: [],
      }),
    );

    await expectModalNotOpen();
  });

  it("should not open when the feature flag is disabled", async () => {
    renderMount({
      ...eligibleState(),
      ...withFlagOverrides({
        largeScreenUpsell: { enabled: false },
        lwdWallet40: { enabled: true, params: { tour: false } },
      }),
    });

    await expectModalNotOpen();
  });

  it("should not open when the modal sub-toggle is disabled", async () => {
    renderMount({
      ...eligibleState(),
      ...withFlagOverrides({
        largeScreenUpsell: {
          enabled: true,
          params: {
            modal: { enabled: false, killThreshold: 3, cadenceDays: 30 },
          },
        },
        lwdWallet40: { enabled: true, params: { tour: false } },
      }),
    });

    await expectModalNotOpen();
  });

  it("should not open when the seen nano model is disabled for the audience", async () => {
    renderMount({
      ...eligibleState(),
      ...withFlagOverrides({
        largeScreenUpsell: {
          enabled: true,
          params: {
            audience: { models: { nanoS: false, nanoSP: true, nanoX: true } },
          },
        },
        lwdWallet40: { enabled: true, params: { tour: false } },
      }),
    });

    await expectModalNotOpen();
  });

  it("should not open when the onboarding cooldown has not elapsed", async () => {
    renderMount({
      ...eligibleState({
        devicesModelList: [DeviceModelId.nanoX],
      }),
      postOnboarding: {
        onboardingDate: "2026-07-14T12:00:00.000Z",
      },
    });

    await expectModalNotOpen();
  });

  it("should not open when onboarding date is missing", async () => {
    renderMount({
      ...eligibleState({
        devicesModelList: [DeviceModelId.nanoX],
      }),
      postOnboarding: {
        onboardingDate: null,
      },
    });

    await expectModalNotOpen();
  });

  it("should not open when retries reach killThreshold 3 within the cadence window", async () => {
    renderMount({
      ...eligibleState(),
      ...withFlagOverrides({
        largeScreenUpsell: {
          enabled: true,
          params: {
            modal: { enabled: true, killThreshold: 3, cadenceDays: 30 },
          },
        },
        lwdWallet40: { enabled: true, params: { tour: false } },
      }),
      largeScreenUpsellModal: {
        retries: 3,
        lastSeenAt: Date.parse("2026-07-14T12:00:00.000Z"),
        session: "ready",
      },
    });

    await expectModalNotOpen();
  });

  it("should open when retries are at killThreshold 3 but the cadence window has elapsed", async () => {
    renderMount({
      ...eligibleState(),
      ...withFlagOverrides({
        largeScreenUpsell: {
          enabled: true,
          params: {
            modal: { enabled: true, killThreshold: 3, cadenceDays: 30 },
          },
        },
        lwdWallet40: { enabled: true, params: { tour: false } },
      }),
      largeScreenUpsellModal: {
        retries: 3,
        lastSeenAt: Date.parse("2026-05-01T12:00:00.000Z"),
        session: "ready",
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId("large-screen-upsell-modal")).toBeVisible();
    });

    expect(trackPage).toHaveBeenCalledWith(
      "Modal - Upgrade",
      undefined,
      expect.objectContaining({
        retriesUpsellModal: 3,
        throttled: true,
      }),
      true,
      false,
    );
  });

  it("should not open when a product tour is competing", async () => {
    renderMount({
      ...withFlagOverrides({
        largeScreenUpsell: { enabled: true },
        lwdWallet40: { enabled: true, params: { tour: true } },
      }),
      settings: {
        hasCompletedOnboarding: true,
        hasSeenWalletV4Tour: false,
        hasSeenQ2Tour: true,
        sharePersonalizedRecommandations: false,
        devicesModelList: [DeviceModelId.nanoS],
      },
      postOnboarding: {
        onboardingDate: "2026-01-01T00:00:00.000Z",
      },
      largeScreenUpsellModal: {
        retries: 0,
        lastSeenAt: null,
        session: "ready",
      },
    });

    await expectModalNotOpen();
  });

  it("should not open when a Q2 tour is competing", async () => {
    renderMount({
      ...withFlagOverrides({
        largeScreenUpsell: { enabled: true },
        lwdWallet40: { enabled: true, params: { tour: false, q2Tour: true } },
      }),
      settings: {
        hasCompletedOnboarding: true,
        hasSeenWalletV4Tour: true,
        hasSeenQ2Tour: false,
        sharePersonalizedRecommandations: false,
        devicesModelList: [DeviceModelId.nanoS],
      },
      postOnboarding: {
        onboardingDate: "2026-01-01T00:00:00.000Z",
      },
      largeScreenUpsellModal: {
        retries: 0,
        lastSeenAt: null,
        session: "ready",
      },
    });

    await expectModalNotOpen();
  });

  it("should not open when Generic Awareness modal is open", async () => {
    renderMount({
      ...eligibleState(),
      dialogs: {
        GENERIC_AWARENESS_MODAL: true,
      },
    });

    await expectModalNotOpen();
  });

  it("should not open later in the same session after a competing modal closes", async () => {
    const { store } = renderMount({
      ...eligibleState(),
      dialogs: {
        GENERIC_AWARENESS_MODAL: true,
      },
    });

    await expectModalNotOpen();

    act(() => {
      store.dispatch(closeDialog("GENERIC_AWARENESS_MODAL"));
    });

    expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBe(false);
    await expectModalNotOpen();
  });

  it("should unmount when a competing modal opens after the upsell is already visible", async () => {
    const { store } = renderMount();

    await waitFor(() => {
      expect(screen.getByTestId("large-screen-upsell-modal")).toBeVisible();
    });

    act(() => {
      store.dispatch(openDialog("GENERIC_AWARENESS_MODAL"));
    });

    await waitFor(() => {
      expect(screen.queryByTestId("large-screen-upsell-modal")).not.toBeInTheDocument();
    });
    expect(store.getState().largeScreenUpsellModal.retries).toBe(1);
  });

  it("should dismiss via Escape with dismissMethod escape key down", async () => {
    renderMount();

    await waitFor(() => {
      expect(screen.getByTestId("large-screen-upsell-modal")).toBeVisible();
    });

    fireEvent.keyDown(screen.getByTestId("large-screen-upsell-modal"), {
      key: "Escape",
      code: "Escape",
    });

    await waitFor(() => {
      expect(screen.queryByTestId("large-screen-upsell-modal")).not.toBeInTheDocument();
    });

    expect(track).toHaveBeenCalledWith("modal_dismissed", {
      modal: "upgrade modal",
      page: "Modal - Upgrade",
      dismissMethod: "escape key down",
      ...NANO_S_OPTED_OUT_ANALYTICS_PROPS,
    });
    expect(track).not.toHaveBeenCalledWith("button_clicked", expect.anything());
  });

  it("should dismiss via outside tap with dismissMethod outside tap", async () => {
    renderMount();

    await waitFor(() => {
      expect(screen.getByTestId("large-screen-upsell-modal")).toBeVisible();
    });

    fireEvent.pointerDown(document.body, { button: 0, clientX: 0, clientY: 0 });

    await waitFor(() => {
      expect(track).toHaveBeenCalledWith("modal_dismissed", {
        modal: "upgrade modal",
        page: "Modal - Upgrade",
        dismissMethod: "outside tap",
        ...NANO_S_OPTED_OUT_ANALYTICS_PROPS,
      });
    });
  });
});
