import React from "react";
import { render, screen, userEvent } from "@tests/test-renderer";
import OnboardScreen from "../index";

const mockDisconnectAllSessions = jest.fn();

jest.mock("@ledgerhq/coin-concordium/network/walletConnect", () => ({
  setWalletConnect: () => ({ disconnectAllSessions: mockDisconnectAllSessions }),
  clearWalletConnect: jest.fn(),
}));

jest.mock("../components/StepOnboard", () => {
  const { Text, TouchableOpacity } = require("react-native");
  return function MockStepOnboard({ onAgree }: { onAgree: () => void }) {
    return (
      <TouchableOpacity testID="step-onboard" onPress={onAgree}>
        <Text>StepOnboard</Text>
      </TouchableOpacity>
    );
  };
});

jest.mock("../components/StepPair", () => {
  const { Text, TouchableOpacity } = require("react-native");
  return function MockStepPair({ onPaired }: { onPaired: () => void }) {
    return (
      <TouchableOpacity testID="step-pair" onPress={onPaired}>
        <Text>StepPair</Text>
      </TouchableOpacity>
    );
  };
});

jest.mock("../components/StepCreate", () => {
  const { Text } = require("react-native");
  return function MockStepCreate() {
    return <Text>StepCreate</Text>;
  };
});

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: () => ({
    params: {
      currency: { id: "concordium", type: "CryptoCurrency" },
      accountsToAdd: [],
    },
  }),
}));

describe("OnboardScreen", () => {
  it("should render StepOnboard initially", () => {
    render(<OnboardScreen />);
    expect(screen.getByText("StepOnboard")).toBeDefined();
  });

  it("should transition to StepPair when agree is pressed", async () => {
    render(<OnboardScreen />);

    await userEvent.press(screen.getByTestId("step-onboard"));

    expect(screen.getByText("StepPair")).toBeDefined();
  });

  it("should transition to StepCreate when pairing completes", async () => {
    render(<OnboardScreen />);

    await userEvent.press(screen.getByTestId("step-onboard"));
    await userEvent.press(screen.getByTestId("step-pair"));

    expect(screen.getByText("StepCreate")).toBeDefined();
  });
});
