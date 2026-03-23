import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import ValidatorRow from "../StakingFlow/ValidatorRow";
import { mockValidators } from "./testUtils";
import { View, Text as RNText, TouchableOpacity } from "react-native";

jest.mock("~/context/Locale", () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => {
    const translations: Record<string, string> = {
      "mina.delegation.commission": "Commission",
    };
    return React.createElement(RNText, null, translations[i18nKey] || i18nKey);
  },
}));

jest.mock("~/components/Circle", () => {
  return {
    __esModule: true,
    default: function MockCircle({ children }: { children: React.ReactNode }) {
      return React.createElement(View, null, children);
    },
  };
});

jest.mock("~/components/FirstLetterIcon", () => {
  return {
    __esModule: true,
    default: function MockFirstLetterIcon({ label }: { label: string }) {
      return React.createElement(RNText, null, label.charAt(0));
    },
  };
});

jest.mock("~/components/Touchable", () => {
  return {
    __esModule: true,
    default: function MockTouchable({
      children,
      onPress,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
    }) {
      return React.createElement(TouchableOpacity, { onPress }, children);
    },
  };
});

describe("ValidatorRow", () => {
  const defaultUnit = { name: "MINA", code: "MINA", magnitude: 9 };
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays the validator name", () => {
    render(<ValidatorRow validator={mockValidators[0]} onPress={mockOnPress} unit={defaultUnit} />);

    expect(screen.getByText("Validator Alpha")).toBeOnTheScreen();
  });

  it("displays the validator commission fee", () => {
    render(<ValidatorRow validator={mockValidators[0]} onPress={mockOnPress} unit={defaultUnit} />);

    expect(screen.getByText(/Commission/)).toBeOnTheScreen();
    expect(screen.getByText(/5%/)).toBeOnTheScreen();
  });

  it("displays the validator stake with unit code", () => {
    render(<ValidatorRow validator={mockValidators[0]} onPress={mockOnPress} unit={defaultUnit} />);

    expect(screen.getByText(/5,000,000 MINA/)).toBeOnTheScreen();
  });

  it("calls onPress with the validator when pressed", async () => {
    const user = userEvent.setup();
    render(<ValidatorRow validator={mockValidators[0]} onPress={mockOnPress} unit={defaultUnit} />);

    await user.press(screen.getByText("Validator Alpha"));
    expect(mockOnPress).toHaveBeenCalledWith(mockValidators[0]);
  });

  it("falls back to address when validator has no name", () => {
    const noNameValidator = { ...mockValidators[0], name: "" };
    render(<ValidatorRow validator={noNameValidator} onPress={mockOnPress} unit={defaultUnit} />);

    expect(screen.getByText(noNameValidator.address)).toBeOnTheScreen();
  });
});
