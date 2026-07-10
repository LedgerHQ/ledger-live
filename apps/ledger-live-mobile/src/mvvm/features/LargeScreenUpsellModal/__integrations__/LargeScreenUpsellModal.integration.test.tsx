import React, { useEffect } from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeviceModelId } from "@ledgerhq/devices";
import { render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { useDispatch } from "~/context/hooks";
import { openBackupHubFeatureIntro } from "~/reducers/backupHubFeatureIntro";
import type { State } from "~/reducers/types";
import { LargeScreenUpsellModalPortfolioMount } from "..";
import { __resetLargeScreenUpsellAutoOpenForTests } from "../components/LargeScreenUpsellModalPortfolioMount/useLargeScreenUpsellModalPortfolioMountViewModel";

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
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    __resetLargeScreenUpsellAutoOpenForTests();
  });

  afterEach(() => {
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
