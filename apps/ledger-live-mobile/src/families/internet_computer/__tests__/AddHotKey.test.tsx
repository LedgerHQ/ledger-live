import type { Transaction } from "@ledgerhq/live-common/families/internet_computer/types";
import { fireEvent, render, screen } from "@tests/test-renderer";
import React from "react";
import AddHotKey from "../NeuronManageFlow/AddHotKey";
import { makeHealthyNeuron } from "./testUtils";

let transaction: Partial<Transaction> = { type: "add_hot_key" };
let status: { errors: Record<string, Error>; warnings: Record<string, Error> } = {
  errors: {},
  warnings: {},
};

// Shaped like the coin module's error classes, whose message defaults to the class name.
const invalidPrincipal = Object.assign(new Error("ICPInvalidHotKey"), { name: "ICPInvalidHotKey" });

jest.mock("../NeuronManageFlow/useNeuronAction", () => ({
  useNeuronAction: () => ({
    account: {},
    neuron: makeHealthyNeuron(),
    transaction,
    updateTransaction: jest.fn(),
    status,
    bridgePending: false,
    continueToDevice: jest.fn(),
  }),
}));

const renderScreen = () =>
  render(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <AddHotKey navigation={{} as any} route={{ params: {} } as any} />,
  );

describe("AddHotKey", () => {
  beforeEach(() => {
    transaction = { type: "add_hot_key" };
    status = { errors: {}, warnings: {} };
  });

  // An absent hot key is not a valid principal, so the screen used to open calling the empty field
  // invalid — while showing a placeholder that is itself a valid principal.
  it("does not call the principal invalid before one has been entered", () => {
    status = { errors: { transaction: invalidPrincipal }, warnings: {} };

    renderScreen();

    expect(screen.queryByText("Invalid principal")).toBeNull();
    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  // The field holds its own text rather than reading it back out of the transaction: that round-trip
  // runs prepareTransaction and getTransactionStatus, and anything typed before it lands is lost when
  // the stale value is pushed back to the input. This mock never re-renders on an update, so the
  // displayed value can only be right if it comes from the screen's own state.
  it("shows what was typed without waiting for the transaction to echo it back", () => {
    renderScreen();

    fireEvent.changeText(screen.getByTestId("icp-hot-key-input"), "aaaaa-aa");

    expect(screen.getByTestId("icp-hot-key-input")).toHaveDisplayValue("aaaaa-aa");
    expect(screen.getByTestId("icp-continue-button")).toBeEnabled();
  });

  it("calls the principal invalid once one has been entered", () => {
    transaction = { type: "add_hot_key", hotKeyToAdd: "hello" };
    status = { errors: { transaction: invalidPrincipal }, warnings: {} };

    renderScreen();

    expect(screen.getByText("Invalid principal")).toBeVisible();
  });
});
