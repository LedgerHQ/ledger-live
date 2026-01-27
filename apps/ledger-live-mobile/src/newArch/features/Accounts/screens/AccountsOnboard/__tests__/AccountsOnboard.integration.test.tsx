/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import AccountsOnboard from "../index";
import { ScreenName } from "~/const";
import { Account, AccountOnboardStatus } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { View, Text } from "react-native";
import * as registryModule from "../registry";
import { StepId } from "../types";
import * as useAccountOnboardingModule from "@ledgerhq/live-common/hooks/useAccountOnboarding";
import * as hooksModule from "~/context/hooks";

jest.mock("@ledgerhq/live-common/hooks/useAccountOnboarding", () => ({
  useOnboardingFlow: jest.fn(),
  useOnboardingAccountData: jest.fn(),
  prepareAccountsForAdding: jest.fn(),
  AccountOnboardStatus: {
    INIT: "INIT",
    PREPARE: "PREPARE",
    SIGN: "SIGN",
    SUBMIT: "SUBMIT",
    SUCCESS: "SUCCESS",
    ERROR: "ERROR",
  },
  StepId: {
    ONBOARD: "ONBOARD",
    FINISH: "FINISH",
  },
}));

jest.mock("../registry", () => ({
  getOnboardingConfig: jest.fn(),
  getOnboardingBridge: jest.fn(),
}));

jest.mock("~/context/hooks", () => {
  const mockUseSelectorFn = jest.fn((selector: any) => {
    const selectorStr = selector?.toString() || "";
    if (selectorStr.includes("lastConnectedDeviceSelector")) {
      return { deviceId: "device-1" };
    }
    if (selectorStr.includes("accountsSelector")) {
      return [];
    }
    return null;
  });

  const mockUseDispatchFn = jest.fn(() => jest.fn());

  (mockUseSelectorFn as any).withTypes = () => mockUseSelectorFn;
  (mockUseDispatchFn as any).withTypes = () => mockUseDispatchFn;

  return {
    useSelector: mockUseSelectorFn,
    useDispatch: mockUseDispatchFn,
  };
});

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock("../components/StepContent", () => ({
  StepContent: ({ stepId }: { stepId: string }) =>
    React.createElement(
      View,
      { testID: `step-${stepId}` },
      React.createElement(Text, {}, `Step ${stepId}`),
    ),
}));

const mockCurrency = {
  id: "canton_network",
  family: "canton",
} as unknown as CryptoCurrency;

const mockAccount = {
  type: "Account" as const,
  id: "account-1",
} as unknown as Account;

describe("AccountsOnboard Integration", () => {
  const mockRoute = {
    params: {
      accountsToAdd: [mockAccount],
      currency: mockCurrency,
      editedNames: {},
    },
    key: "test-key",
    name: ScreenName.AccountsOnboard,
  };

  const mockOnboardingConfig = {
    stepComponents: {
      [StepId.ONBOARD]: jest.fn(),
      [StepId.FINISH]: jest.fn(),
    },
    footerComponents: {
      [StepId.ONBOARD]: jest.fn(() => <div>Footer</div>),
      [StepId.FINISH]: jest.fn(() => <div>Footer</div>),
    },
    translationKeys: {
      title: "test.title",
      reonboardTitle: "test.reonboardTitle",
      init: "test.init",
      reonboardInit: "test.reonboardInit",
      success: "test.success",
      reonboardSuccess: "test.reonboardSuccess",
      error: "test.error",
    },
    urls: {},
    stepFlow: [StepId.ONBOARD, StepId.FINISH],
  };

  const mockOnboardingBridge = {
    onboardAccount: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const { getOnboardingConfig, getOnboardingBridge } = jest.mocked(registryModule);

    getOnboardingConfig.mockReturnValue(mockOnboardingConfig);
    getOnboardingBridge.mockReturnValue(mockOnboardingBridge);

    const { useSelector, useDispatch } = jest.mocked(hooksModule);
    useSelector.mockImplementation((selector: any) => {
      const selectorStr = selector?.toString() || "";
      if (selectorStr.includes("lastConnectedDeviceSelector")) {
        return { deviceId: "device-1" };
      }
      if (selectorStr.includes("accountsSelector")) {
        return [];
      }
      return null;
    });
    useDispatch.mockReturnValue(jest.fn());

    const { useOnboardingAccountData, useOnboardingFlow, prepareAccountsForAdding } = jest.mocked(
      useAccountOnboardingModule,
    );

    useOnboardingAccountData.mockReturnValue({
      importableAccounts: [],
      creatableAccount: mockAccount,
      accountName: "Test Account",
    });

    useOnboardingFlow.mockReturnValue({
      error: null,
      isProcessing: false,
      onboardingResult: undefined,
      onboardingStatus: AccountOnboardStatus.INIT,
      stepId: StepId.ONBOARD,
      transitionTo: jest.fn(),
      handleOnboardAccount: jest.fn(),
      handleRetryOnboardAccount: jest.fn(),
    });

    prepareAccountsForAdding.mockReturnValue({
      accounts: [mockAccount],
      renamings: {},
    });
  });

  it("should render onboarding step initially", () => {
    const Stack = createNativeStackNavigator();
    const TestNavigator = () => (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name={ScreenName.AccountsOnboard}
            component={AccountsOnboard as any}
            initialParams={mockRoute.params}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );

    const { getByTestId } = render(<TestNavigator />);
    expect(getByTestId("step-ONBOARD")).toBeDefined();
  });

  it("should transition to FINISH step on success", async () => {
    const transitionTo = jest.fn();
    const { useOnboardingFlow } = jest.mocked(useAccountOnboardingModule);

    useOnboardingFlow.mockReturnValue({
      error: null,
      isProcessing: false,
      onboardingResult: { completedAccount: mockAccount },
      onboardingStatus: AccountOnboardStatus.SUCCESS,
      stepId: StepId.FINISH,
      transitionTo,
      handleOnboardAccount: jest.fn(),
      handleRetryOnboardAccount: jest.fn(),
    });

    const Stack = createNativeStackNavigator();
    const TestNavigator = () => (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name={ScreenName.AccountsOnboard}
            component={AccountsOnboard as any}
            initialParams={mockRoute.params}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );

    const { getByTestId } = render(<TestNavigator />);
    await waitFor(() => {
      expect(getByTestId("step-FINISH")).toBeDefined();
    });
  });

  it("should handle error state", () => {
    const { useOnboardingFlow } = jest.mocked(useAccountOnboardingModule);
    useOnboardingFlow.mockReturnValue({
      error: new Error("Test error"),
      isProcessing: false,
      onboardingResult: undefined,
      onboardingStatus: AccountOnboardStatus.ERROR,
      stepId: StepId.ONBOARD,
      transitionTo: jest.fn(),
      handleOnboardAccount: jest.fn(),
      handleRetryOnboardAccount: jest.fn(),
    });

    const Stack = createNativeStackNavigator();
    const TestNavigator = () => (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name={ScreenName.AccountsOnboard}
            component={AccountsOnboard as any}
            initialParams={mockRoute.params}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );

    const { getByTestId } = render(<TestNavigator />);
    expect(getByTestId("step-ONBOARD")).toBeDefined();
  });

  it("should throw error when onboarding config is missing", () => {
    const { getOnboardingConfig } = jest.mocked(registryModule);

    getOnboardingConfig.mockReturnValue(null);

    const Stack = createNativeStackNavigator();
    const TestNavigator = () => (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name={ScreenName.AccountsOnboard}
            component={AccountsOnboard as any}
            initialParams={mockRoute.params}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );

    expect(() => render(<TestNavigator />)).toThrow("No onboarding support");
  });

  it("should handle reonboarding flow", () => {
    const { useOnboardingAccountData } = jest.mocked(useAccountOnboardingModule);
    useOnboardingAccountData.mockReturnValue({
      importableAccounts: [],
      creatableAccount: mockAccount,
      accountName: "Reonboard Account",
    });

    const reonboardRoute = {
      ...mockRoute,
      params: {
        ...mockRoute.params,
        isReonboarding: true,
        accountToReonboard: mockAccount,
      },
    };

    const Stack = createNativeStackNavigator();
    const TestNavigator = () => (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name={ScreenName.AccountsOnboard}
            component={AccountsOnboard as any}
            initialParams={reonboardRoute.params}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );

    const { getByTestId } = render(<TestNavigator />);
    expect(getByTestId("step-ONBOARD")).toBeDefined();
  });
});
