import React from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeviceModelId } from "@ledgerhq/devices";
import { render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { LargeScreenUpsellModalPortfolioMount } from "..";
import { __resetLargeScreenUpsellAutoOpenForTests } from "../screens/LargeScreenUpsellModalPortfolioMount/useLargeScreenUpsellModalPortfolioMountViewModel";

const Stack = createNativeStackNavigator();

function withKnownDeviceModels(deviceModelIds: DeviceModelId[]) {
  return (state: State): State => ({
    ...state,
    settings: {
      ...state.settings,
      knownDeviceModelIds: {
        ...state.settings.knownDeviceModelIds,
        ...Object.fromEntries(deviceModelIds.map(deviceModelId => [deviceModelId, true])),
      },
      productTourCompleted: true,
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

function IntegrationNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Portfolio">
      <Stack.Screen name="Portfolio" component={PortfolioScreenWithUpsellMount} />
    </Stack.Navigator>
  );
}

describe("LargeScreenUpsellModal on Portfolio (integration)", () => {
  beforeEach(() => {
    __resetLargeScreenUpsellAutoOpenForTests();
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
});
