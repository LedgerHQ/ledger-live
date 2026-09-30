import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen } from "@tests/test-renderer";
import DebugFeatureFlags from "../index";

jest.mock("@react-native-firebase/app", () => ({
  getApp: () => ({ options: { projectId: "ledger-live-staging" } }),
}));

const Stack = createNativeStackNavigator();

function FeatureFlagsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DebugFeatureFlags" component={DebugFeatureFlags} />
    </Stack.Navigator>
  );
}

describe("DebugFeatureFlags", () => {
  it("shows the Firebase project bundled in the build", () => {
    render(<FeatureFlagsStack />);

    expect(screen.getByText("ledger-live-staging")).toBeVisible();
  });
});
