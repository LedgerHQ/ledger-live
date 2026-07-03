import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { View, Text as RNText, TouchableOpacity } from "react-native";
import { createMockMinaAccount, createMockOperation } from "./testUtils";

const mockNavigate = jest.fn();
const mockPop = jest.fn();

jest.mock("~/context/hooks", () => ({
  useSelector: (selectorFn: (state: unknown) => unknown) => {
    if (typeof selectorFn === "function") {
      return selectorFn({});
    }
    return {};
  },
}));

jest.mock("~/reducers/accounts", () => ({
  accountScreenSelector: () => () => ({
    account: createMockMinaAccount(),
    parentAccount: undefined,
  }),
}));

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "mina.selectValidator.success.title": "Transaction successfully broadcasted",
        "mina.selectValidator.success.description":
          "Your delegation change request has been broadcasted.",
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock("~/components/ValidateSuccess", () => {
  return {
    __esModule: true,
    default: function MockValidateSuccess({
      title,
      description,
      onClose,
      onViewDetails,
    }: {
      title: string;
      description: string;
      onClose: () => void;
      onViewDetails: () => void;
    }) {
      return React.createElement(
        View,
        { testID: "validate-success-screen" },
        React.createElement(RNText, null, title),
        React.createElement(RNText, null, description),
        React.createElement(
          TouchableOpacity,
          { onPress: onViewDetails, testID: "success-view-details-button" },
          React.createElement(RNText, null, "View Details"),
        ),
        React.createElement(
          TouchableOpacity,
          { onPress: onClose, testID: "success-close-button" },
          React.createElement(RNText, null, "Close"),
        ),
      );
    },
  };
});

import StakingValidationSuccess from "../StakingFlow/04-ValidationSuccess";

const mockOperation = createMockOperation();

const createMockProps = () => ({
  navigation: {
    navigate: mockNavigate,
    getParent: () => ({
      pop: mockPop,
    }),
  } as never,
  route: {
    params: {
      accountId: "js:2:mina:B62qtest:mina",
      deviceId: "device-1",
      transaction: { family: "mina", recipient: "B62qtest" },
      result: mockOperation,
    },
  } as never,
});

describe("StakingValidationSuccess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the success screen with testID", () => {
    render(<StakingValidationSuccess {...createMockProps()} />);

    expect(screen.getByTestId("validate-success-screen")).toBeOnTheScreen();
  });

  it("displays the success title", () => {
    render(<StakingValidationSuccess {...createMockProps()} />);

    expect(screen.getByText("Transaction successfully broadcasted")).toBeOnTheScreen();
  });

  it("displays the success description", () => {
    render(<StakingValidationSuccess {...createMockProps()} />);

    expect(
      screen.getByText("Your delegation change request has been broadcasted."),
    ).toBeOnTheScreen();
  });

  it("has a view details button", () => {
    render(<StakingValidationSuccess {...createMockProps()} />);

    expect(screen.getByTestId("success-view-details-button")).toBeOnTheScreen();
  });

  it("has a close button", () => {
    render(<StakingValidationSuccess {...createMockProps()} />);

    expect(screen.getByTestId("success-close-button")).toBeOnTheScreen();
  });

  it("calls parent pop when close is pressed", () => {
    render(<StakingValidationSuccess {...createMockProps()} />);

    fireEvent.press(screen.getByTestId("success-close-button"));
    expect(mockPop).toHaveBeenCalled();
  });

  it("navigates to operation details when view details is pressed", () => {
    render(<StakingValidationSuccess {...createMockProps()} />);

    fireEvent.press(screen.getByTestId("success-view-details-button"));
    expect(mockNavigate).toHaveBeenCalled();
  });
});
