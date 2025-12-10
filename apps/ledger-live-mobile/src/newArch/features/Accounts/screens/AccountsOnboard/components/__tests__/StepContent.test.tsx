/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render } from "@testing-library/react-native";
import { StepContent } from "../StepContent";
import { StepId, OnboardingConfig } from "../../types";
import { cantonTranslationKeys } from "../../adapters/canton";
import { AccountOnboardStatus } from "@ledgerhq/types-live";

const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

const MockStepOnboard = jest.fn(() => <div data-testid="step-onboard">Onboard</div>);
const MockStepFinish = jest.fn(() => <div data-testid="step-finish">Finish</div>);

const mockOnboardingConfig: OnboardingConfig = {
  stepComponents: {
    [StepId.ONBOARD]: MockStepOnboard,
    [StepId.FINISH]: MockStepFinish,
  },
  footerComponents: {
    [StepId.ONBOARD]: jest.fn(),
    [StepId.FINISH]: jest.fn(),
  },
  translationKeys: cantonTranslationKeys,
  urls: {},
  stepFlow: [StepId.ONBOARD, StepId.FINISH],
};

const mockStableProps = {
  currency: {} as any,
  device: { deviceId: "device-1" },
  accountName: "Test Account",
  editedNames: {},
  creatableAccount: {} as any,
  importableAccounts: [],
  onboardingConfig: mockOnboardingConfig,
  isReonboarding: false,
  onAddAccounts: jest.fn(),
  onOnboardAccount: jest.fn(),
  onRetryOnboardAccount: jest.fn(),
  transitionTo: jest.fn(),
};

const mockDynamicProps = {
  onboardingStatus: AccountOnboardStatus.INIT,
  onboardingResult: undefined,
  isProcessing: false,
  error: null,
};

describe("StepContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should render ONBOARD step component", () => {
    const { getByTestId } = render(
      <StepContent
        stepId={StepId.ONBOARD}
        stableProps={mockStableProps}
        dynamicProps={mockDynamicProps}
        onboardingConfig={mockOnboardingConfig}
      />,
    );
    expect(getByTestId("step-onboard")).toBeDefined();
    expect(MockStepOnboard).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockStableProps,
        ...mockDynamicProps,
      }),
      {},
    );
  });

  it("should render FINISH step component", () => {
    const { getByTestId } = render(
      <StepContent
        stepId={StepId.FINISH}
        stableProps={mockStableProps}
        dynamicProps={mockDynamicProps}
        onboardingConfig={mockOnboardingConfig}
      />,
    );
    expect(getByTestId("step-finish")).toBeDefined();
    expect(MockStepFinish).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockStableProps,
        ...mockDynamicProps,
      }),
      {},
    );
  });

  it("should log error and return null for missing step component", () => {
    const invalidConfig = {
      ...mockOnboardingConfig,
      stepComponents: {
        ...mockOnboardingConfig.stepComponents,
        [StepId.ONBOARD]: undefined as any,
      },
    };

    const { queryByTestId } = render(
      <StepContent
        stepId={StepId.ONBOARD}
        stableProps={mockStableProps}
        dynamicProps={mockDynamicProps}
        onboardingConfig={invalidConfig}
      />,
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("No step component found for stepId: ONBOARD"),
    );
    expect(queryByTestId("step-onboard")).toBeNull();
  });

  it("should pass all props to step component", () => {
    render(
      <StepContent
        stepId={StepId.ONBOARD}
        stableProps={mockStableProps}
        dynamicProps={mockDynamicProps}
        onboardingConfig={mockOnboardingConfig}
      />,
    );

    expect(MockStepOnboard).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: mockStableProps.currency,
        device: mockStableProps.device,
        accountName: mockStableProps.accountName,
        onboardingStatus: mockDynamicProps.onboardingStatus,
        error: mockDynamicProps.error,
      }),
      {},
    );
  });
});
