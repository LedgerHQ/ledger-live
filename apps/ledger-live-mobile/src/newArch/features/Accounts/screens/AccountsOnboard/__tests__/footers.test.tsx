/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { StepOnboardFooter, StepFinishFooter } from "../footers";
import { AccountOnboardStatus, StepId } from "../types";

jest.mock("@ledgerhq/native-ui", () => {
  const mockViewComponentFn = ({ children, testID, ...props }: any) =>
    React.createElement(View, { testID, ...props }, children);
  return {
    Button: ({ children, onPress, testID, disabled, ...props }: any) =>
      React.createElement(
        TouchableOpacity,
        { testID, onPress: disabled ? undefined : onPress, disabled, ...props },
        children,
      ),
    Flex: mockViewComponentFn,
    InfiniteLoader: () => React.createElement(View, { testID: "infinite-loader" }),
  };
});

jest.mock("react-i18next", () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => React.createElement(Text, {}, i18nKey),
}));

describe("Footers", () => {
  describe("StepOnboardFooter", () => {
    const mockProps = {
      onboardingStatus: AccountOnboardStatus.INIT,
      isProcessing: false,
      onOnboardAccount: jest.fn(),
      onRetryOnboardAccount: jest.fn(),
      transitionTo: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should render continue button for INIT status", () => {
      const { getByText } = render(<StepOnboardFooter {...mockProps} />);
      const button = getByText("common.continue");
      expect(button).toBeDefined();
    });

    it("should call onOnboardAccount when continue button is pressed", () => {
      const { getByText } = render(<StepOnboardFooter {...mockProps} />);
      const text = getByText("common.continue");
      const button = text.parent as any;
      fireEvent.press(button);
      expect(mockProps.onOnboardAccount).toHaveBeenCalledTimes(1);
    });

    it("should return null for SIGN status", () => {
      const { queryByText } = render(
        <StepOnboardFooter {...mockProps} onboardingStatus={AccountOnboardStatus.SIGN} />,
      );
      expect(queryByText("common.continue")).toBeNull();
    });

    it("should render continue button for SUCCESS status", () => {
      const { getByText } = render(
        <StepOnboardFooter {...mockProps} onboardingStatus={AccountOnboardStatus.SUCCESS} />,
      );
      const button = getByText("common.continue");
      expect(button).toBeDefined();
    });

    it("should call transitionTo with FINISH when continue is pressed on SUCCESS", () => {
      const { getByText } = render(
        <StepOnboardFooter {...mockProps} onboardingStatus={AccountOnboardStatus.SUCCESS} />,
      );
      const text = getByText("common.continue");
      const button = text.parent as any;
      fireEvent.press(button);
      expect(mockProps.transitionTo).toHaveBeenCalledWith(StepId.FINISH);
    });

    it("should render try again button for ERROR status", () => {
      const { getByText } = render(
        <StepOnboardFooter {...mockProps} onboardingStatus={AccountOnboardStatus.ERROR} />,
      );
      const button = getByText("common.tryAgain");
      expect(button).toBeDefined();
    });

    it("should call onRetryOnboardAccount when try again button is pressed", () => {
      const { getByText } = render(
        <StepOnboardFooter {...mockProps} onboardingStatus={AccountOnboardStatus.ERROR} />,
      );
      const text = getByText("common.tryAgain");
      const button = text.parent as any;
      fireEvent.press(button);
      expect(mockProps.onRetryOnboardAccount).toHaveBeenCalledTimes(1);
    });

    it("should disable button when isProcessing is true", () => {
      const { getByText } = render(<StepOnboardFooter {...mockProps} isProcessing={true} />);
      const text = getByText("common.continue");
      const button = text.parent as any;
      expect(button.props.disabled).toBe(true);
    });
  });

  describe("StepFinishFooter", () => {
    const mockProps = {
      onAddAccounts: jest.fn(),
      importableAccounts: [],
      onboardingResult: undefined,
      isReonboarding: false,
      isProcessing: false,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should render done button for normal onboarding", () => {
      const { getByText } = render(<StepFinishFooter {...mockProps} isProcessing={false} />);
      const button = getByText("common.done");
      expect(button).toBeDefined();
    });

    it("should render continue button for reonboarding", () => {
      const { getByText } = render(
        <StepFinishFooter {...mockProps} isReonboarding={true} isProcessing={false} />,
      );
      const button = getByText("common.continue");
      expect(button).toBeDefined();
    });

    it("should call onAddAccounts with importable accounts when done is pressed", () => {
      const importableAccounts = [
        { id: "account-1", type: "Account" },
        { id: "account-2", type: "Account" },
      ] as any[];

      const { getByText } = render(
        <StepFinishFooter
          {...mockProps}
          importableAccounts={importableAccounts}
          isProcessing={false}
        />,
      );
      const text = getByText("common.done");
      const button = text.parent as any;
      fireEvent.press(button);

      expect(mockProps.onAddAccounts).toHaveBeenCalledWith(importableAccounts);
    });

    it("should include completed account when onboardingResult is provided", () => {
      const importableAccounts = [{ id: "account-1", type: "Account" }] as any[];
      const completedAccount = { id: "account-completed", type: "Account" } as any;

      const { getByText } = render(
        <StepFinishFooter
          {...mockProps}
          importableAccounts={importableAccounts}
          onboardingResult={{ completedAccount }}
          isProcessing={false}
        />,
      );
      const text = getByText("common.done");
      const button = text.parent as any;
      fireEvent.press(button);

      expect(mockProps.onAddAccounts).toHaveBeenCalledWith([
        ...importableAccounts,
        completedAccount,
      ]);
    });
  });
});
