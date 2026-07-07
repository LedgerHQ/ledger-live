import React from "react";
import { render } from "@tests/test-renderer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import { component as AddAccountNavigator, options } from "../AddAccountNavigator";
import type { AleoAddAccountParamList } from "../types";
import { aleoCurrency } from "../../__mocks__/currency.mock";
import { ALEO_ACCOUNT_1 } from "../../__mocks__/account.mock";

type ScreenProps = {
  route: {
    params: {
      onCloseNavigation?: () => void;
      initialRouteName?: ScreenName;
    };
  };
};

// Capture the props that AddAccountNavigator injects into the inner screens.
let capturedRouteParams: ScreenProps["route"]["params"] | null = null;
let capturedApproveRouteParams: ScreenProps["route"]["params"] | null = null;
let capturedNoAccountsAddedRouteParams: ScreenProps["route"]["params"] | null = null;

jest.mock("../ViewKeyWarningScreen", () => {
  return function MockViewKeyWarningScreen({ route }: ScreenProps) {
    capturedRouteParams = route.params;
    return <></>;
  };
});

jest.mock("../ViewKeyApproveScreen", () => {
  return function MockViewKeyApproveScreen({ route }: ScreenProps) {
    capturedApproveRouteParams = route.params;
    return <></>;
  };
});

jest.mock("../NoAccountsAddedScreen", () => {
  return function MockNoAccountsAddedScreen({ route }: ScreenProps) {
    capturedNoAccountsAddedRouteParams = route.params;
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
    capturedApproveRouteParams = null;
    capturedNoAccountsAddedRouteParams = null;
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

  it("defaults to the ViewKeyWarning screen when no initialRouteName is provided", () => {
    render(makeTestNavigator());
    expect(capturedRouteParams).not.toBeNull();
    expect(capturedApproveRouteParams).toBeNull();
  });

  it("routes to ViewKeyApprove and injects onCloseNavigation when initialRouteName is AleoViewKeyApprove with accountsToAdd", () => {
    const Stack = createNativeStackNavigator<AleoAddAccountParamList>();
    render(
      <Stack.Navigator>
        <Stack.Screen
          name={ScreenName.AleoAddAccount}
          component={AddAccountNavigator}
          initialParams={{
            currency: aleoCurrency,
            device: mockDevice,
            initialRouteName: ScreenName.AleoViewKeyApprove,
            accountsToAdd: [ALEO_ACCOUNT_1],
          }}
        />
      </Stack.Navigator>,
    );
    expect(capturedApproveRouteParams).not.toBeNull();
    expect(capturedRouteParams).toBeNull();
    expect(capturedApproveRouteParams?.onCloseNavigation).toBeInstanceOf(Function);
  });

  it("falls back to ViewKeyWarning when initialRouteName is AleoViewKeyApprove but accountsToAdd is missing", () => {
    const Stack = createNativeStackNavigator<AleoAddAccountParamList>();
    render(
      <Stack.Navigator>
        <Stack.Screen
          name={ScreenName.AleoAddAccount}
          component={AddAccountNavigator}
          initialParams={{
            currency: aleoCurrency,
            device: mockDevice,
            initialRouteName: ScreenName.AleoViewKeyApprove,
          }}
        />
      </Stack.Navigator>,
    );
    expect(capturedRouteParams).not.toBeNull();
    expect(capturedApproveRouteParams).toBeNull();
  });

  it("falls back to ViewKeyWarning when initialRouteName is AleoViewKeyApprove but accountsToAdd is empty", () => {
    const Stack = createNativeStackNavigator<AleoAddAccountParamList>();
    render(
      <Stack.Navigator>
        <Stack.Screen
          name={ScreenName.AleoAddAccount}
          component={AddAccountNavigator}
          initialParams={{
            currency: aleoCurrency,
            device: mockDevice,
            initialRouteName: ScreenName.AleoViewKeyApprove,
            accountsToAdd: [],
          }}
        />
      </Stack.Navigator>,
    );
    expect(capturedRouteParams).not.toBeNull();
    expect(capturedApproveRouteParams).toBeNull();
  });

  it("routes to NoAccountsAdded and injects onCloseNavigation when initialRouteName is AleoNoAccountsAdded", () => {
    const Stack = createNativeStackNavigator<AleoAddAccountParamList>();
    render(
      <Stack.Navigator>
        <Stack.Screen
          name={ScreenName.AleoAddAccount}
          component={AddAccountNavigator}
          initialParams={{
            currency: aleoCurrency,
            device: mockDevice,
            initialRouteName: ScreenName.AleoNoAccountsAdded,
          }}
        />
      </Stack.Navigator>,
    );
    expect(capturedNoAccountsAddedRouteParams).not.toBeNull();
    expect(capturedRouteParams).toBeNull();
    expect(capturedApproveRouteParams).toBeNull();
    expect(capturedNoAccountsAddedRouteParams?.onCloseNavigation).toBeInstanceOf(Function);
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
    expect(mockPop).toHaveBeenCalledTimes(1);
    expect(mockPop).toHaveBeenCalledWith(2);
  });

  it("pops navigationDepth screens when navigationDepth is provided", () => {
    render(
      <AddAccountNavigator
        route={
          { params: { currency: aleoCurrency, device: mockDevice, navigationDepth: 4 } } as any
        }
        navigation={{ getParent: () => ({ pop: mockPop }) } as any}
      />,
    );
    capturedRouteParams?.onCloseNavigation?.();
    expect(mockPop).toHaveBeenCalledTimes(1);
    expect(mockPop).toHaveBeenCalledWith(4);
  });

  it("does not throw when there is no parent navigator to pop", () => {
    render(
      <AddAccountNavigator
        route={{ params: { currency: aleoCurrency, device: mockDevice } } as any}
        navigation={{ getParent: () => undefined } as any}
      />,
    );
    expect(() => capturedRouteParams?.onCloseNavigation?.()).not.toThrow();
    expect(mockPop).not.toHaveBeenCalled();
  });
});
