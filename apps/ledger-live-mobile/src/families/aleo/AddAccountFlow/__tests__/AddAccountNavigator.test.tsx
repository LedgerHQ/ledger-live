import React from "react";
import { render } from "@tests/test-renderer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import { component as AddAccountNavigator, options } from "../AddAccountNavigator";
import type { AleoAddAccountParamList } from "../types";
import { aleoCurrency } from "../../__mocks__/currency.mock";

type ScreenProps = { route: { params: { onCloseNavigation?: () => void } } };

// Capture the props that AddAccountNavigator injects into the inner screen.
let capturedRouteParams: ScreenProps["route"]["params"] | null = null;

jest.mock("../ViewKeyWarningScreen", () => {
  return function MockViewKeyWarningScreen({ route }: ScreenProps) {
    capturedRouteParams = route.params;
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
const mockPop = jest.fn();

const makeTestNavigator = (navigationDepth?: number) => {
  const Stack = createNativeStackNavigator<AleoAddAccountParamList>();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={ScreenName.AleoAddAccount}
        component={AddAccountNavigator}
        initialParams={{ currency: aleoCurrency, device: mockDevice, navigationDepth }}
      />
    </Stack.Navigator>
  );
};

describe("AleoAddAccountNavigator", () => {
  beforeEach(() => {
    capturedRouteParams = null;
    mockPop.mockClear();
  });

  it("exports headerShown: false options", () => {
    expect(options).toEqual({ headerShown: false });
  });

  it("renders without crashing", () => {
    expect(() => render(makeTestNavigator())).not.toThrow();
  });

  it("injects an onCloseNavigation function into the inner screen's route params", () => {
    render(makeTestNavigator());
    expect(capturedRouteParams?.onCloseNavigation).toBeInstanceOf(Function);
  });
});

describe("AleoAddAccountNavigator — handleClose", () => {
  beforeEach(() => {
    capturedRouteParams = null;
    mockPop.mockClear();
  });

  it("pops 2 screens (default depth) when no navigationDepth is provided", () => {
    render(
      <AddAccountNavigator
        route={{ params: { currency: aleoCurrency, device: mockDevice } } as any}
        navigation={{ getParent: () => ({ pop: mockPop }) } as any}
      />,
    );
    capturedRouteParams?.onCloseNavigation?.();
    expect(mockPop).toHaveBeenCalledWith(2);
  });

  it("pops navigationDepth screens when navigationDepth is provided", () => {
    render(
      <AddAccountNavigator
        route={{ params: { currency: aleoCurrency, device: mockDevice, navigationDepth: 4 } } as any}
        navigation={{ getParent: () => ({ pop: mockPop }) } as any}
      />,
    );
    capturedRouteParams?.onCloseNavigation?.();
    expect(mockPop).toHaveBeenCalledWith(4);
  });
});
