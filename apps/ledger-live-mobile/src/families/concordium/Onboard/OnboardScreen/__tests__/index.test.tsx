import React from "react";
import { render, screen, userEvent } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import OnboardScreen from "../index";
import type { State } from "~/reducers/types";

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
  return function MockStepPair({ onPaired }: { onPaired: (sessionTopic: string) => void }) {
    return (
      <TouchableOpacity testID="step-pair" onPress={() => onPaired("ABCD1234sessiontopic")}>
        <Text>StepPair</Text>
      </TouchableOpacity>
    );
  };
});

jest.mock("../components/StepPairSuccess", () => {
  const { Text, TouchableOpacity } = require("react-native");
  return function MockStepPairSuccess({ onContinue }: { onContinue: () => void }) {
    return (
      <TouchableOpacity testID="step-pair-success" onPress={onContinue}>
        <Text>StepPairSuccess</Text>
      </TouchableOpacity>
    );
  };
});

jest.mock("../components/StepCreate", () => {
  const { Text, TouchableOpacity } = require("react-native");
  return function MockStepCreate({
    sessionTopic,
    onSessionExpired,
    onCreated,
  }: {
    sessionTopic: string;
    onSessionExpired: () => void;
    onCreated: () => void;
    creatableAccount: unknown;
  }) {
    return (
      <>
        <Text>StepCreate</Text>
        <Text testID="session-topic">{sessionTopic}</Text>
        <TouchableOpacity testID="session-expired" onPress={onSessionExpired} />
        <TouchableOpacity testID="account-created" onPress={onCreated} />
      </>
    );
  };
});

jest.mock("../components/StepFinish", () => {
  const { Text } = require("react-native");
  return function MockStepFinish() {
    return <Text>StepFinish</Text>;
  };
});

const mockGoBack = jest.fn();
const mockParentGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    goBack: mockGoBack,
    getParent: () => ({ goBack: mockParentGoBack }),
  }),
  useRoute: () => ({
    params: {
      currency: { id: "concordium", type: "CryptoCurrency" },
      accountsToAdd: [
        {
          id: "account-1",
          type: "Account",
          used: false,
          currency: { name: "Concordium" },
          index: 0,
        },
      ],
    },
  }),
}));

const overrideInitialState = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    lastConnectedDevice: {
      deviceId: "test-device-id",
      modelId: DeviceModelId.nanoX,
      wired: false,
    },
  },
});

describe("OnboardScreen", () => {
  it("should render StepOnboard initially", () => {
    render(<OnboardScreen />, { overrideInitialState });
    expect(screen.getByText("StepOnboard")).toBeDefined();
  });

  it("should transition to StepPair when agree is pressed", async () => {
    render(<OnboardScreen />, { overrideInitialState });

    await userEvent.press(screen.getByTestId("step-onboard"));

    expect(screen.getByText("StepPair")).toBeDefined();
  });

  it("should transition to StepPairSuccess after pairing", async () => {
    render(<OnboardScreen />, { overrideInitialState });

    await userEvent.press(screen.getByTestId("step-onboard"));
    await userEvent.press(screen.getByTestId("step-pair"));

    expect(screen.getByText("StepPairSuccess")).toBeDefined();
  });

  it("should transition to StepCreate with sessionTopic when continuing from pair success", async () => {
    render(<OnboardScreen />, { overrideInitialState });

    await userEvent.press(screen.getByTestId("step-onboard"));
    await userEvent.press(screen.getByTestId("step-pair"));
    await userEvent.press(screen.getByTestId("step-pair-success"));

    expect(screen.getByText("StepCreate")).toBeDefined();
    expect(screen.getByTestId("session-topic").props.children).toBe("ABCD1234sessiontopic");
  });

  it("should transition to StepFinish when account is created", async () => {
    render(<OnboardScreen />, { overrideInitialState });

    await userEvent.press(screen.getByTestId("step-onboard"));
    await userEvent.press(screen.getByTestId("step-pair"));
    await userEvent.press(screen.getByTestId("step-pair-success"));
    await userEvent.press(screen.getByTestId("account-created"));

    expect(screen.getByText("StepFinish")).toBeDefined();
  });

  it("should return to StepPair when session expires", async () => {
    render(<OnboardScreen />, { overrideInitialState });

    await userEvent.press(screen.getByTestId("step-onboard"));
    await userEvent.press(screen.getByTestId("step-pair"));
    await userEvent.press(screen.getByTestId("step-pair-success"));

    expect(screen.getByText("StepCreate")).toBeDefined();

    await userEvent.press(screen.getByTestId("session-expired"));

    expect(screen.getByText("StepPair")).toBeDefined();
  });
});
