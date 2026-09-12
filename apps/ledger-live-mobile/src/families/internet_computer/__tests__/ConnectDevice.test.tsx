import type { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import { fireEvent, render, screen } from "@tests/test-renderer";
import React from "react";
import { ScreenName } from "~/const";
import ConnectDevice from "../NeuronManageFlow/ConnectDevice";
import { makeHealthyNeuron, makeICPAccount } from "./testUtils";

// Shaped like the coin module's error classes: the message defaults to the class name.
const makeError = (name: string) => Object.assign(new Error(name), { name });

let neuron: ICPNeuron | undefined;
// Not a `renderScreen` argument: a default parameter is applied to an explicit `undefined` too, so
// the list_neurons case below would have been handed the id it is meant to be missing.
let neuronId: string | undefined;
let errors: Record<string, Error>;
let bridgePending: boolean;
let bridgeError: Error | undefined;

const mockNavigate = jest.fn();

// Stood in for so the gate can be tested without mounting DeviceAction, which starts talking to a
// device the moment it renders.
jest.mock("../components/ConnectDevice", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: "icp-device-action" }),
  };
});

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: makeICPAccount(), parentAccount: null }),
}));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({}),
}));
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: () => ({
    transaction: { family: "internet_computer", type: "disburse" },
    status: { errors, warnings: {} },
    bridgePending,
    bridgeError,
  }),
}));
jest.mock("@ledgerhq/live-common/families/internet_computer/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/internet_computer/react"),
  useICPNeuronById: () => neuron,
}));

const renderScreen = () =>
  render(
    <ConnectDevice
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation={{ navigate: mockNavigate } as any}
      route={
        {
          params: {
            accountId: "icp-1",
            neuronId,
            transaction: { family: "internet_computer", type: "disburse" },
            device: { deviceId: "device-1" },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any
      }
    />,
  );

/*
 * The screens that collect input are stopped by their own footer, but disburse, spawn, the dissolve
 * toggles, stake maturity, refresh voting power, auto-stake and remove hot key go straight from a
 * button to the device. Before this gate they reached it with no bridge validation at all, and the
 * refusal came back from the canister a device confirmation later.
 */
describe("neuron ConnectDevice", () => {
  beforeEach(() => {
    neuron = makeHealthyNeuron();
    neuronId = "1";
    errors = {};
    bridgePending = false;
    bridgeError = undefined;
    mockNavigate.mockClear();
  });

  it("hands a transaction the bridge accepts to the device screen", () => {
    renderScreen();

    expect(screen.getByTestId("icp-device-action")).toBeVisible();
    expect(screen.queryByTestId("icp-blocked-action")).toBeNull();
  });

  it("reports the bridge's objection instead of reaching the device", () => {
    errors = { transaction: makeError("ICPDisburseNotAllowed") };

    renderScreen();

    expect(screen.getByTestId("icp-blocked-action")).toBeVisible();
    expect(screen.getByText("Cannot disburse this neuron")).toBeVisible();
    expect(screen.queryByTestId("icp-device-action")).toBeNull();
  });

  // createCustomErrorClass falls back to the class name, so an untranslated banner would read
  // "ICPDisburseNotAllowed" at the user.
  it("translates the objection rather than showing its class name", () => {
    errors = { transaction: makeError("ICPDisburseNotAllowed") };

    renderScreen();

    expect(screen.queryByText("ICPDisburseNotAllowed")).toBeNull();
    expect(screen.getByText(/fully dissolved/)).toBeVisible();
  });

  it("offers the way back to the neuron list from a refused action", () => {
    errors = { transaction: makeError("ICPDisburseNotAllowed") };

    renderScreen();
    fireEvent.press(screen.getByTestId("icp-blocked-action-back-button"));

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.InternetComputerNeuronList, {
      accountId: "icp-1",
      parentId: undefined,
    });
  });

  // A bridgeError never reaches status.errors, so reading only that slot would let it through.
  it("reports an error the bridge threw outright", () => {
    bridgeError = makeError("ICPNeuronsNotRead");

    renderScreen();

    expect(screen.getByTestId("icp-blocked-action")).toBeVisible();
    expect(screen.queryByTestId("icp-device-action")).toBeNull();
  });

  // DeviceAction starts an exchange on mount, so mounting it before the verdict lands and
  // unmounting it after would interrupt one already under way.
  it("waits for the bridge before mounting the device screen", () => {
    bridgePending = true;
    errors = { transaction: makeError("ICPDisburseNotAllowed") };

    renderScreen();

    expect(screen.queryByTestId("icp-device-action")).toBeNull();
    expect(screen.queryByTestId("icp-blocked-action")).toBeNull();
  });

  // Disburse and a refresh both drop a neuron from the snapshot while the transaction still names
  // it, so the neuron can go between the screen that offered the action and this one.
  it("says the neuron has gone rather than signing against it", () => {
    neuron = undefined;

    renderScreen();

    expect(screen.getByTestId("icp-missing-neuron-back-button")).toBeVisible();
    expect(screen.queryByTestId("icp-device-action")).toBeNull();
  });

  // `list_neurons` refreshes the whole account and names no neuron, so it has nothing to gate on
  // and must not be mistaken for an action whose neuron has gone.
  it("lets a refresh that names no neuron straight through", () => {
    neuron = undefined;
    neuronId = undefined;

    renderScreen();

    expect(screen.getByTestId("icp-device-action")).toBeVisible();
    expect(screen.queryByTestId("icp-missing-neuron-back-button")).toBeNull();
  });
});
