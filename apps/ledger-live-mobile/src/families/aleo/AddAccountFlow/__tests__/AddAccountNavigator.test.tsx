import React from "react";
import { render } from "@tests/test-renderer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import { component as AddAccountNavigator, options } from "../AddAccountNavigator";
import type { AleoAddAccountParamList } from "../types";
import { aleoCurrency } from "../../__mocks__/currency.mock";

jest.mock("../ViewKeyWarningScreen", () => {
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

const mockDevice = { deviceId: "device-1", modelId: "nanoX", wired: false };

const TestNavigator = () => {
  const Stack = createNativeStackNavigator<AleoAddAccountParamList>();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={ScreenName.AleoAddAccount}
        component={AddAccountNavigator}
        initialParams={{ currency: aleoCurrency, device: mockDevice }}
      />
    </Stack.Navigator>
  );
};

describe("AleoAddAccountNavigator", () => {
  it("exports headerShown: false options", () => {
    expect(options).toEqual({ headerShown: false });
  });

  it("renders without crashing", () => {
    expect(() => render(<TestNavigator />)).not.toThrow();
  });
});
