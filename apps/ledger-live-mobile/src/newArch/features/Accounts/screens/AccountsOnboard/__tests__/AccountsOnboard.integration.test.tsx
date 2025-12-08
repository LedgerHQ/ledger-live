/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AccountsOnboard from "../index";
import { ScreenName } from "~/const";
import { Account, AccountOnboardStatus } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import * as registryModule from "../registry";
import * as reactRedux from "react-redux";
import { StepId } from "../types";

const mockUseOnboardingFlow = jest.fn();
const mockUseOnboardingAccountData = jest.fn();
const mockPrepareAccountsForAdding = jest.fn();

jest.mock("@ledgerhq/live-common/hooks/useOnboarding", () => ({
  useOnboardingFlow: mockUseOnboardingFlow,
  useOnboardingAccountData: mockUseOnboardingAccountData,
  prepareAccountsForAdding: mockPrepareAccountsForAdding,
  AccountOnboardStatus: {
    INIT: "INIT",
    PREPARE: "PREPARE",
    SIGN: "SIGN",
    SUBMIT: "SUBMIT",
    SUCCESS: "SUCCESS",
    ERROR: "ERROR",
  },
}));

jest.mock("../registry", () => ({
  getOnboardingConfig: jest.fn(),
  getOnboardingBridge: jest.fn(),
}));

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(() => jest.fn()),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock("../components/StepContent", () => ({
  StepContent: ({ stepId }: { stepId: string }) => (
    <div data-testid={`step-${stepId}`}>Step {stepId}</div>
  ),
}));

jest.mock("@ledgerhq/native-ui", () => ({
  Flex: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockCurrency = {
  type: "CryptoCurrency",
  id: "canton_network",
  ticker: "CANTON",
  name: "Canton Network",
  family: "canton",
  units: [],
  signatureScheme: "ed25519",
  color: "#000000",
  managerAppName: "Canton",
  coinType: 60,
  scheme: "canton",
  explorerViews: [],
} as unknown as CryptoCurrency;

const mockAccount = {
  type: "Account",
  id: "account-1",
  name: "Test Account",
  seedIdentifier: "seed-1",
  derivationMode: "",
  index: 0,
  freshAddress: "0x123",
  freshAddressPath: "44'/0'/0'",
  used: false,
  balance: { toString: () => "0" } as any,
  spendableBalance: { toString: () => "0" } as any,
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  balanceHistoryCache: {},
  swapHistory: [],
  lastSyncDate: new Date(),
  creationDate: new Date(),
  blockHeight: 0,
  currency: mockCurrency,
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
    const { useSelector, useDispatch } = jest.mocked(reactRedux);

    getOnboardingConfig.mockReturnValue(mockOnboardingConfig);
    getOnboardingBridge.mockReturnValue(mockOnboardingBridge);
    useSelector.mockReturnValue({ deviceId: "device-1" });
    useDispatch.mockReturnValue(jest.fn());

    mockUseOnboardingAccountData.mockReturnValue({
      importableAccounts: [],
      creatableAccount: mockAccount,
      accountName: "Test Account",
    });

    mockUseOnboardingFlow.mockReturnValue({
      error: null,
      isProcessing: false,
      onboardingResult: undefined,
      onboardingStatus: AccountOnboardStatus.INIT,
      stepId: StepId.ONBOARD,
      transitionTo: jest.fn(),
      handleOnboardAccount: jest.fn(),
      handleRetryOnboardAccount: jest.fn(),
    });

    mockPrepareAccountsForAdding.mockReturnValue({
      accounts: [mockAccount],
      renamings: {},
    });
  });

  it("should render onboarding step initially", () => {
    const Stack = createNativeStackNavigator();
    const TestNavigator = () => (
      <Stack.Navigator>
        <Stack.Screen
          name={ScreenName.AccountsOnboard}
          component={AccountsOnboard}
          initialParams={mockRoute.params}
        />
      </Stack.Navigator>
    );

    const { getByTestId } = render(<TestNavigator />);
    expect(getByTestId("step-ONBOARD")).toBeDefined();
  });

  it("should transition to FINISH step on success", async () => {
    const transitionTo = jest.fn();

    mockUseOnboardingFlow.mockReturnValue({
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
      <Stack.Navigator>
        <Stack.Screen
          name={ScreenName.AccountsOnboard}
          component={AccountsOnboard}
          initialParams={mockRoute.params}
        />
      </Stack.Navigator>
    );

    const { getByTestId } = render(<TestNavigator />);
    await waitFor(() => {
      expect(getByTestId("step-FINISH")).toBeDefined();
    });
  });

  it("should handle error state", () => {
    mockUseOnboardingFlow.mockReturnValue({
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
      <Stack.Navigator>
        <Stack.Screen
          name={ScreenName.AccountsOnboard}
          component={AccountsOnboard}
          initialParams={mockRoute.params}
        />
      </Stack.Navigator>
    );

    const { getByTestId } = render(<TestNavigator />);
    expect(getByTestId("step-ONBOARD")).toBeDefined();
  });

  it("should throw error when onboarding config is missing", () => {
    const { getOnboardingConfig } = jest.mocked(registryModule);

    getOnboardingConfig.mockReturnValue(null);

    const Stack = createNativeStackNavigator();
    const TestNavigator = () => (
      <Stack.Navigator>
        <Stack.Screen
          name={ScreenName.AccountsOnboard}
          component={AccountsOnboard}
          initialParams={mockRoute.params}
        />
      </Stack.Navigator>
    );

    expect(() => render(<TestNavigator />)).toThrow("No onboarding support");
  });

  it("should handle reonboarding flow", () => {
    mockUseOnboardingAccountData.mockReturnValue({
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
      <Stack.Navigator>
        <Stack.Screen
          name={ScreenName.AccountsOnboard}
          component={AccountsOnboard}
          initialParams={reonboardRoute.params}
        />
      </Stack.Navigator>
    );

    const { getByTestId } = render(<TestNavigator />);
    expect(getByTestId("step-ONBOARD")).toBeDefined();
  });
});
