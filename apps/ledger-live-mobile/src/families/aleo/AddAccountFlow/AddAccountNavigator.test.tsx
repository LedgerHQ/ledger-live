import React from "react";
import { Platform } from "react-native";
import { render } from "@tests/test-renderer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import { component as AddAccountNavigator, options } from "./AddAccountNavigator";
import type { AleoAddAccountParamList } from "./types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

jest.mock("./ViewKeyWarningScreen", () => {
  return function MockViewKeyWarningScreen() {
    return <></>;
  };
});

jest.mock("~/navigation/navigatorConfig", () => ({
  getStackNavigatorConfig: jest.fn(() => ({
    headerStyle: { backgroundColor: "#000" },
    headerTintColor: "#fff",
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

const mockCurrency: CryptoOrTokenCurrency = {
  type: "CryptoCurrency",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  id: "aleo" as any,
  name: "Aleo",
  ticker: "ALEO",
  units: [],
  managerAppName: "Aleo",
  coinType: 7027,
  scheme: "aleo",
  color: "#000000",
  family: "aleo",
  blockAvgTime: 5,
  supportsSegwit: false,
  supportsNativeSegwit: false,
  explorerViews: [],
};

const mockDevice = { deviceId: "device-1", modelId: "nanoX", wired: false };

const TestNavigator = () => {
  const Stack = createNativeStackNavigator<AleoAddAccountParamList>();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={ScreenName.AleoAddAccount}
        component={AddAccountNavigator}
        initialParams={{ currency: mockCurrency, device: mockDevice }}
      />
    </Stack.Navigator>
  );
};

describe("AleoAddAccountNavigator", () => {
  it("renders without crashing", () => {
    const result = render(<TestNavigator />);
    expect(result).toBeDefined();
  });

  it("exports headerShown: false options", () => {
    expect(options).toEqual({ headerShown: false });
  });

  it("renders on iOS", () => {
    const originalPlatform = Platform.OS;
    Platform.OS = "ios";
    const result = render(<TestNavigator />);
    expect(result).toBeDefined();
    Platform.OS = originalPlatform;
  });

  it("renders on Android", () => {
    const originalPlatform = Platform.OS;
    Platform.OS = "android";
    const result = render(<TestNavigator />);
    expect(result).toBeDefined();
    Platform.OS = originalPlatform;
  });
});
