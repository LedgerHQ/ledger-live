import React, { useEffect } from "react";
import { Linking, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeviceModelId } from "@ledgerhq/devices";
import { act, fireEvent, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { screen as analyticsScreen, track } from "~/analytics";
import { useDispatch } from "~/context/hooks";
import { openBackupHubFeatureIntro } from "~/reducers/backupHubFeatureIntro";
import type { State } from "~/reducers/types";
import { LargeScreenUpsellModalPortfolioMount } from "..";
import { __resetLargeScreenUpsellAutoOpenForTests } from "../components/LargeScreenUpsellModalPortfolioMount/useLargeScreenUpsellModalPortfolioMountViewModel";

const NANO_S_OPTED_OUT_ANALYTICS_PROPS = {
  deviceModel: "lns",
  personalRecoOptIn: false,
  offerType: "none",
  platform: "lwm",
  retriesUpsellModal: 0,
  throttled: false,
};
const NANO_S_OPTED_IN_ANALYTICS_PROPS = {
  ...NANO_S_OPTED_OUT_ANALYTICS_PROPS,
  personalRecoOptIn: true,
  offerType: "discount",
};

const Stack = createNativeStackNavigator();
const NOW = new Date("2026-06-01T12:00:00.000Z");

function withKnownDeviceModels(
  deviceModelIds: DeviceModelId[],
  settingsOverrides: Partial<State["settings"]> = {},
) {
  return (state: State): State => ({
    ...state,
    settings: {
      ...state.settings,
      knownDeviceModelIds: {
        ...state.settings.knownDeviceModelIds,
        ...Object.fromEntries(deviceModelIds.map(deviceModelId => [deviceModelId, true])),
      },
      productTourCompleted: true,
      ...settingsOverrides,
    },
    postOnboarding: {
      ...state.postOnboarding,
      onboardingDate: "2026-06-01T12:00:00.000Z",
    },
  });
}

function PortfolioScreenWithUpsellMount() {
  return (
    <View style={{ flex: 1 }} testID="large-screen-upsell-integration-portfolio">
      <LargeScreenUpsellModalPortfolioMount />
    </View>
  );
}

function DelayedBackupHubCompetitor() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(openBackupHubFeatureIntro());
  }, [dispatch]);

  return null;
}

function PortfolioScreenWithDelayedCompetitor() {
  return (
    <View style={{ flex: 1 }} testID="large-screen-upsell-integration-portfolio">
      <DelayedBackupHubCompetitor />
      <LargeScreenUpsellModalPortfolioMount />
    </View>
  );
}

function IntegrationNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Portfolio">
      <Stack.Screen name="Portfolio" component={PortfolioScreenWithUpsellMount} />
    </Stack.Navigator>
  );
}

function IntegrationNavigatorWithDelayedCompetitor() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Portfolio">
      <Stack.Screen name="Portfolio" component={PortfolioScreenWithDelayedCompetitor} />
    </Stack.Navigator>
  );
}

describe("LargeScreenUpsellModal on Portfolio (integration)", () => {
  let canOpenURLSpy: jest.SpiedFunction<typeof Linking.canOpenURL>;
  let openURLSpy: jest.SpiedFunction<typeof Linking.openURL>;

  beforeEach(() => {
    jest.clearAllMocks();
    canOpenURLSpy = jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
    openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    jest.useFakeTimers().setSystemTime(NOW);
    __resetLargeScreenUpsellAutoOpenForTests();
  });

  afterEach(() => {
    canOpenURLSpy.mockRestore();
    openURLSpy.mockRestore();
    jest.useRealTimers();
  });

  it("should auto-open the upsell modal when eligible and unblocked", async () => {
    const overrideInitialState = withFlagOverrides(
      {
        largeScreenUpsell: { enabled: true },
        lwmProductTour: { enabled: false },
        lwmGenericAwarenessModal: { enabled: false },
        analyticsOptIn: { enabled: false },
      },
      withKnownDeviceModels([DeviceModelId.nanoS]),
    );

    render(<IntegrationNavigator />, { overrideInitialState });

    expect(await screen.findByTestId("large-screen-upsell-integration-portfolio")).toBeVisible();
    expect(screen.getByTestId("large-screen-upsell-portfolio-mount")).toBeVisible();

    await waitFor(() => {
      expect(screen.getByTestId("large-screen-upsell-modal-drawer")).toBeVisible();
    });
  });

  it("should track the modal view with shared analytics properties when it auto-opens", async () => {
    const overrideInitialState = withFlagOverrides(
      {
        largeScreenUpsell: { enabled: true },
        lwmProductTour: { enabled: false },
        lwmGenericAwarenessModal: { enabled: false },
        analyticsOptIn: { enabled: false },
      },
      withKnownDeviceModels([DeviceModelId.nanoS]),
    );

    render(<IntegrationNavigator />, { overrideInitialState });

    await waitFor(() => {
      expect(screen.getByTestId("large-screen-upsell-modal-drawer")).toBeVisible();
    });

    expect(jest.mocked(analyticsScreen)).toHaveBeenCalledWith("Modal - Upgrade", undefined, {
      name: "Modal - Upgrade",
      sourceFlow: "app start",
      modalFrequencyState: "every start",
      ...NANO_S_OPTED_OUT_ANALYTICS_PROPS,
    });
  });

  it("should track opted-in offer properties when personalized recommendations are enabled", async () => {
    const overrideInitialState = withFlagOverrides(
      {
        largeScreenUpsell: { enabled: true },
        lwmProductTour: { enabled: false },
        lwmGenericAwarenessModal: { enabled: false },
        analyticsOptIn: { enabled: false },
      },
      withKnownDeviceModels([DeviceModelId.nanoS], {
        personalizedRecommendationsEnabled: true,
      }),
    );

    render(<IntegrationNavigator />, { overrideInitialState });

    await waitFor(() => {
      expect(screen.getByTestId("large-screen-upsell-modal-drawer")).toBeVisible();
    });

    expect(jest.mocked(analyticsScreen)).toHaveBeenCalledWith("Modal - Upgrade", undefined, {
      name: "Modal - Upgrade",
      sourceFlow: "app start",
      modalFrequencyState: "every start",
      ...NANO_S_OPTED_IN_ANALYTICS_PROPS,
    });
  });

  it("should track button_clicked with shared analytics properties when the CTA is pressed", async () => {
    const overrideInitialState = withFlagOverrides(
      {
        largeScreenUpsell: { enabled: true },
        lwmProductTour: { enabled: false },
        lwmGenericAwarenessModal: { enabled: false },
        analyticsOptIn: { enabled: false },
      },
      withKnownDeviceModels([DeviceModelId.nanoS]),
    );

    const { user } = render(<IntegrationNavigator />, { overrideInitialState });

    await waitFor(() => {
      expect(screen.getByTestId("large-screen-upsell-modal-drawer")).toBeVisible();
    });

    await user.press(screen.getByTestId("large-screen-upsell-modal-primary-button"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "explore large screen devices",
      page: "Modal - Upgrade",
      ...NANO_S_OPTED_OUT_ANALYTICS_PROPS,
    });
    expect(track).not.toHaveBeenCalledWith("modal_dismissed", expect.anything());
  });

  it("should track modal_dismissed with dismissMethod close button exactly once when the header close button is pressed", async () => {
    const overrideInitialState = withFlagOverrides(
      {
        largeScreenUpsell: { enabled: true },
        lwmProductTour: { enabled: false },
        lwmGenericAwarenessModal: { enabled: false },
        analyticsOptIn: { enabled: false },
      },
      withKnownDeviceModels([DeviceModelId.nanoS]),
    );

    const { user } = render(<IntegrationNavigator />, { overrideInitialState });

    await waitFor(() => {
      expect(screen.getByTestId("large-screen-upsell-modal-drawer")).toBeVisible();
    });

    const closeButton = screen.getByTestId("bottom-sheet-header-close-button");
    await user.press(closeButton);
    fireEvent(closeButton, "dismiss");
    act(() => jest.runOnlyPendingTimers());

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

  it("should auto-open the upsell modal when product tour is enabled but onboarding is not completed", async () => {
    const overrideInitialState = withFlagOverrides(
      {
        largeScreenUpsell: { enabled: true },
        lwmProductTour: { enabled: true },
        lwmGenericAwarenessModal: { enabled: false },
        analyticsOptIn: { enabled: false },
      },
      withKnownDeviceModels([DeviceModelId.nanoS], {
        hasCompletedOnboarding: false,
        productTourCompleted: false,
      }),
    );

    render(<IntegrationNavigator />, { overrideInitialState });

    expect(await screen.findByTestId("large-screen-upsell-integration-portfolio")).toBeVisible();
    expect(screen.getByTestId("large-screen-upsell-portfolio-mount")).toBeVisible();

    await waitFor(() => {
      expect(screen.getByTestId("large-screen-upsell-modal-drawer")).toBeVisible();
    });
  });

  it("should not auto-open the upsell modal when a competing app-start modal opens after mount", async () => {
    const overrideInitialState = withFlagOverrides(
      {
        largeScreenUpsell: { enabled: true },
        lwmProductTour: { enabled: false },
        lwmGenericAwarenessModal: { enabled: false },
        analyticsOptIn: { enabled: false },
      },
      withKnownDeviceModels([DeviceModelId.nanoS]),
    );

    const { store } = render(<IntegrationNavigatorWithDelayedCompetitor />, {
      overrideInitialState,
    });

    expect(await screen.findByTestId("large-screen-upsell-integration-portfolio")).toBeVisible();

    await waitFor(() => {
      expect(store.getState().backupHubFeatureIntro.isOpen).toBe(true);
    });
    expect(store.getState().largeScreenUpsellModal.retries).toBe(0);
  });
});
