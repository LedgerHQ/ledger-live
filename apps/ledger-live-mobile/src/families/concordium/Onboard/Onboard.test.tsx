import React from "react";
import { Platform } from "react-native";
import { render } from "@tests/test-renderer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ConcordiumOnboard } from "../index";
import { ScreenName } from "~/const";
import type { ConcordiumOnboardAccountParamList } from "./types";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";

jest.mock("./OnboardScreen", () => {
  const { Text } = require("react-native");
  return function MockOnboardScreen() {
    return <Text>MockOnboardScreen</Text>;
  };
});

jest.mock("~/navigation/navigatorConfig", () => ({
  getStackNavigatorConfig: jest.fn(() => ({
    headerStyle: { backgroundColor: "#000" },
  })),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useTheme: jest.fn(() => ({
    colors: {
      background: "#000",
      card: "#111",
      text: "#fff",
      border: "#333",
      notification: "#ff0000",
      primary: "#0066cc",
    },
    fonts: {
      bold: "System",
      regular: "System",
      medium: "System",
    },
  })),
}));

const mockCurrency = getCryptoCurrencyById("concordium");
const mockAccount = genAccount("concordium-test", { currency: mockCurrency });

const TestNavigator = () => {
  const Stack = createNativeStackNavigator<ConcordiumOnboardAccountParamList>();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={ScreenName.ConcordiumOnboardAccount}
        component={ConcordiumOnboard.component}
        initialParams={{ accountsToAdd: [mockAccount], currency: mockCurrency }}
      />
    </Stack.Navigator>
  );
};

describe("Concordium Onboard Component", () => {
  it("should render without crashing", () => {
    const result = render(<TestNavigator />);
    expect(result).toBeDefined();
  });

  it("should have headerShown set to false in options", () => {
    expect(ConcordiumOnboard.options).toEqual({ headerShown: false });
  });

  it("should render on iOS", () => {
    const originalPlatform = Platform.OS;
    Platform.OS = "ios";

    const result = render(<TestNavigator />);
    expect(result).toBeDefined();

    Platform.OS = originalPlatform;
  });

  it("should render on Android", () => {
    const originalPlatform = Platform.OS;
    Platform.OS = "android";

    const result = render(<TestNavigator />);
    expect(result).toBeDefined();

    Platform.OS = originalPlatform;
  });
});
