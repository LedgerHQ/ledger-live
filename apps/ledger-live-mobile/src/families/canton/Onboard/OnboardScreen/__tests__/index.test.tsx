/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { AuthorizeStatus, OnboardStatus } from "@ledgerhq/coin-canton/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { render, screen } from "@tests/test-renderer";
import React from "react";
import OnboardScreen from "../index";
import type { OnboardScreenProps } from "../types";
import * as UseOnboardScreenViewModel from "../useOnboardScreenViewModel";
import { getStatusTranslationKey } from "../hooks";
import {
  createMockAccount,
  createMockCurrency,
  createMockDevice,
  createMockNavigation,
  createMockRouteParams,
} from "./test-utils";

jest.mock("../useOnboardScreenViewModel", () => ({
  ...jest.requireActual("../useOnboardScreenViewModel"),
  useOnboardScreenViewModel: jest.fn(),
}));

type MockViewModel = ReturnType<typeof UseOnboardScreenViewModel.useOnboardScreenViewModel>;

const createMockViewModel = (overrides?: Partial<MockViewModel>): MockViewModel => {
  const onboardingStatus = overrides?.onboardingStatus ?? OnboardStatus.INIT;
  const authorizeStatus = overrides?.authorizeStatus ?? AuthorizeStatus.INIT;
  const onboardResult = overrides?.onboardResult ?? null;
  const error = overrides?.error ?? null;
  const isReonboarding = overrides?.isReonboarding ?? false;

  const hasResult = !!onboardResult;
  const isAuthorizationPhase = hasResult && onboardingStatus !== OnboardStatus.ERROR;
  const displayStatus = isAuthorizationPhase ? authorizeStatus : onboardingStatus;
  const showError = Boolean(
    error &&
      (onboardingStatus === OnboardStatus.ERROR || authorizeStatus === AuthorizeStatus.ERROR),
  );
  const successKey = isReonboarding ? "canton.onboard.reonboard.success" : "canton.onboard.success";

  const statusTranslationKey = getStatusTranslationKey(displayStatus, isAuthorizationPhase);

  return {
    onboardingStatus,
    authorizeStatus,
    onboardResult,
    error,
    accountsToDisplay: [createMockAccount()],
    selectedIds: ["test-account-id"],
    isReonboarding,
    isProcessing: false,
    showDeviceModal: false,
    isNetworkProcessing: false,
    confirmDisabled: false,
    handleConfirm: jest.fn(),
    retryOnboarding: jest.fn(),
    device: createMockDevice(),
    cryptoCurrency: createMockCurrency() as CryptoCurrency,
    deviceActionRequest: { currency: createMockCurrency() as CryptoCurrency },
    action: {
      useHook: jest.fn(() => ({})),
      mapResult: jest.fn(),
    } as unknown as MockViewModel["action"],
    isAuthorizationPhase,
    displayStatus,
    showError,
    successKey,
    statusTranslationKey,
    ...overrides,
  };
};

describe("OnboardScreen Component", () => {
  const mockRouteParams = createMockRouteParams();
  const mockNavigation = createMockNavigation();

  const renderComponent = (
    routeParams: ReturnType<typeof createMockRouteParams> = mockRouteParams,
    viewModelOverrides?: Partial<MockViewModel>,
  ) => {
    const mockRoute = {
      params: routeParams,
    };

    const mockViewModel = createMockViewModel(viewModelOverrides);

    jest
      .spyOn(UseOnboardScreenViewModel, "useOnboardScreenViewModel")
      .mockReturnValue(mockViewModel);

    return render(
      <OnboardScreen
        navigation={mockNavigation as unknown as OnboardScreenProps["navigation"]}
        route={mockRoute as unknown as OnboardScreenProps["route"]}
      />,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    expect(() => renderComponent()).not.toThrow();
  });

  it("should display accounts from ViewModel", () => {
    const accounts = [
      createMockAccount({ id: "account-1" }),
      createMockAccount({ id: "account-2" }),
    ];

    renderComponent(mockRouteParams, {
      accountsToDisplay: accounts,
      selectedIds: ["account-1", "account-2"],
    });

    expect(screen.getByTestId("account-account-1")).toBeDefined();
    expect(screen.getByTestId("account-account-2")).toBeDefined();
  });

  it("should show ProcessingScreen when isNetworkProcessing is true", () => {
    renderComponent(mockRouteParams, {
      isNetworkProcessing: true,
    });

    expect(screen.getByTestId("processing-screen")).toBeDefined();
  });

  it("should show DeviceActionModal when showDeviceModal is true", () => {
    renderComponent(mockRouteParams, {
      showDeviceModal: true,
    });

    expect(screen.getByTestId("device-action-modal")).toBeDefined();
  });

  it("should show reonboarding warning when isReonboarding is true", () => {
    renderComponent(mockRouteParams, {
      isReonboarding: true,
    });

    expect(screen.getByText("Topology Change Detected")).toBeDefined();
  });

  it("should show error section when error exists", () => {
    renderComponent(mockRouteParams, {
      error: new Error("Test error"),
      onboardingStatus: OnboardStatus.ERROR,
    });

    expect(screen.getByText("Error")).toBeDefined();
  });

  it("should show loading indicator for PREPARE status", () => {
    renderComponent(mockRouteParams, {
      onboardingStatus: OnboardStatus.PREPARE,
    });

    expect(screen.getByText(/Preparing account onboarding transaction/i)).toBeDefined();
  });

  it("should show loading indicator for SUBMIT status", () => {
    renderComponent(mockRouteParams, {
      onboardingStatus: OnboardStatus.SUBMIT,
    });

    expect(screen.getByText("Onboarding account...")).toBeDefined();
  });

  it("should show success alert for SUCCESS status", () => {
    const { toJSON } = renderComponent(mockRouteParams, {
      onboardingStatus: OnboardStatus.SUCCESS,
    });

    const jsonOutput = JSON.stringify(toJSON());
    expect(jsonOutput).toContain("Account onboarded successfully");
  });

  it("should display reonboard title when isReonboarding is true", () => {
    renderComponent(mockRouteParams, {
      isReonboarding: true,
    });

    expect(screen.getByText("Account Update Required")).toBeDefined();
  });

  it("should display normal title when isReonboarding is false", () => {
    renderComponent(mockRouteParams, {
      isReonboarding: false,
    });

    expect(screen.getByText("Onboarding")).toBeDefined();
  });

  it("should show confirm button", () => {
    renderComponent();

    expect(screen.getByText("Confirm")).toBeDefined();
  });
});
