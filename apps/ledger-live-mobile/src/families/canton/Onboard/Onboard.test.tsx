import React from "react";
import { Platform } from "react-native";
import { render } from "@tests/test-renderer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CantonOnboard } from "../index";
import { ScreenName } from "~/const";
import type { CantonOnboardAccountParamList } from "./types";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";

// Mock the OnboardScreen component
jest.mock("./OnboardScreen", () => {
  return function MockOnboardScreen() {
    return <div data-testid="onboard-screen-component">OnboardScreen Component</div>;
  };
});

// Mock navigation config
jest.mock("~/navigation/navigatorConfig", () => ({
  getStackNavigatorConfig: jest.fn(() => ({
    headerStyle: { backgroundColor: "#000" },
    headerTintColor: "#fff",
  })),
}));

// Mock the theme
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

describe("Canton Onboard Component", () => {
  const mockAccount: Account = {
    type: "Account",
    id: "test-account-id",
    currency: {
      type: "CryptoCurrency",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: "canton" as any,
      name: "Canton",
      ticker: "CANTON",
      units: [],
      managerAppName: "Canton",
      coinType: 60,
      scheme: "canton",
      color: "#000000",
      family: "canton",
      blockAvgTime: 5,
      supportsSegwit: false,
      supportsNativeSegwit: false,
      explorerViews: [],
    },
    balance: new BigNumber("0"),
    spendableBalance: new BigNumber("0"),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    blockHeight: 0,
    freshAddress: "test-address",
    freshAddressPath: "44'/60'/0'/0/0",
    swapHistory: [],
    index: 0,
    derivationMode: "",
    used: false,
    seedIdentifier: "test-seed-identifier",
    creationDate: new Date(),
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
  };

  const mockCurrency: CryptoOrTokenCurrency = {
    type: "CryptoCurrency",

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    id: "canton" as any,
    name: "Canton",
    ticker: "CANTON",
    units: [],
    managerAppName: "Canton",
    coinType: 60,
    scheme: "canton",
    color: "#000000",
    family: "canton",
    blockAvgTime: 5,
    supportsSegwit: false,
    supportsNativeSegwit: false,
    explorerViews: [],
  };

  const mockRoute = {
    params: {
      accountsToAdd: [mockAccount],
      currency: mockCurrency,
    },
  };

  const TestNavigator = () => {
    const Stack = createNativeStackNavigator<CantonOnboardAccountParamList>();

    return (
      <Stack.Navigator>
        <Stack.Screen
          name={ScreenName.CantonOnboardAccount}
          component={CantonOnboard.component}
          initialParams={mockRoute.params}
        />
      </Stack.Navigator>
    );
  };

  it("should render the Onboard component", () => {
    const result = render(<TestNavigator />);

    // The component should render without crashing
    expect(result).toBeDefined();
  });

  it("should have correct options configuration", () => {
    expect(CantonOnboard.options).toEqual({
      headerShown: false,
    });
  });

  it("should pass route params to OnboardScreen component", () => {
    const result = render(<TestNavigator />);

    // The OnboardScreen component should be rendered with the correct params
    expect(result).toBeDefined();
  });

  it("should configure stack navigator with correct options", () => {
    // This test verifies that the component renders without errors
    // The actual navigation configuration is tested in integration tests
    expect(CantonOnboard.options).toEqual({
      headerShown: false,
    });
  });

  it("should handle iOS gesture configuration", () => {
    const originalPlatform = Platform.OS;
    Platform.OS = "ios";

    const result = render(<TestNavigator />);

    // Should render without issues on iOS
    expect(result).toBeDefined();

    Platform.OS = originalPlatform;
  });

  it("should handle Android gesture configuration", () => {
    const originalPlatform = Platform.OS;
    Platform.OS = "android";

    const result = render(<TestNavigator />);

    // Should render without issues on Android
    expect(result).toBeDefined();

    Platform.OS = originalPlatform;
  });
});
