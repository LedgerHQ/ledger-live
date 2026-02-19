import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { View, Text as RNText, TouchableOpacity } from "react-native";

const mockGoBack = jest.fn();
const mockParentGoBack = jest.fn();

jest.mock("~/components/ValidateError", () => {
  return {
    __esModule: true,
    default: function MockValidateError({
      error,
      onRetry,
      onClose,
    }: {
      error: Error;
      onRetry: () => void;
      onClose: () => void;
    }) {
      return React.createElement(
        View,
        { testID: "validate-error" },
        React.createElement(RNText, null, error.message),
        React.createElement(
          TouchableOpacity,
          { onPress: onRetry, testID: "retry-button" },
          React.createElement(RNText, null, "Retry"),
        ),
        React.createElement(
          TouchableOpacity,
          { onPress: onClose, testID: "close-button" },
          React.createElement(RNText, null, "Close"),
        ),
      );
    },
  };
});

import StakingValidationError from "../StakingFlow/04-ValidationError";

const createMockProps = () => ({
  navigation: {
    goBack: mockGoBack,
    getParent: () => ({
      goBack: mockParentGoBack,
    }),
  } as never,
  route: {
    params: {
      accountId: "js:2:mina:B62qtest:mina",
      deviceId: "device-1",
      transaction: { family: "mina", recipient: "B62qtest" },
      error: new Error("Transaction broadcast failed"),
    },
  } as never,
});

describe("StakingValidationError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the error message", () => {
    render(<StakingValidationError {...createMockProps()} />);

    expect(screen.getByText("Transaction broadcast failed")).toBeOnTheScreen();
  });

  it("renders retry and close buttons", () => {
    render(<StakingValidationError {...createMockProps()} />);

    expect(screen.getByText("Retry")).toBeOnTheScreen();
    expect(screen.getByText("Close")).toBeOnTheScreen();
  });

  it("calls navigation.goBack when retry is pressed", () => {
    render(<StakingValidationError {...createMockProps()} />);

    fireEvent.press(screen.getByTestId("retry-button"));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it("calls parent navigation goBack when close is pressed", () => {
    render(<StakingValidationError {...createMockProps()} />);

    fireEvent.press(screen.getByTestId("close-button"));
    expect(mockParentGoBack).toHaveBeenCalled();
  });
});
