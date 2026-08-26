import type {
  ICPNeuron,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { fireEvent, render, screen } from "@tests/test-renderer";
import React from "react";
import Followees from "../NeuronManageFlow/Followees";
import { makeHealthyNeuron } from "./testUtils";

const GOVERNANCE = 4;

let transaction: Partial<Transaction>;
let neuron: ICPNeuron;

// The screen drives the followee list through updateTransaction, so the mock applies each updater
// to keep `transaction` the record of what would actually be submitted.
const updateTransaction = jest.fn((updater: (tx: Partial<Transaction>) => Partial<Transaction>) => {
  transaction = updater(transaction);
});

jest.mock("../NeuronManageFlow/useNeuronAction", () => ({
  useNeuronAction: () => ({
    account: {},
    neuron,
    transaction,
    updateTransaction,
    status: { errors: {}, warnings: {} },
    bridgePending: false,
    continueToDevice: jest.fn(),
  }),
}));

const renderScreen = () =>
  render(
    <Followees
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation={{} as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      route={{ params: {} } as any}
    />,
  );

describe("Followees", () => {
  beforeEach(() => {
    transaction = { type: "follow" };
    neuron = makeHealthyNeuron({ followees: [] });
    updateTransaction.mockClear();
  });

  // The topic names the list being edited, and it is read off the transaction the device will sign
  // rather than held here, so the two cannot disagree.
  it("names the topic the transaction carries", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: [] };

    renderScreen();

    expect(screen.getByText(/Governance/)).toBeVisible();
  });

  it("keeps only the digits of the entry, since a neuron id is numeric", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: [] };

    renderScreen();
    fireEvent.changeText(screen.getByTestId("icp-followee-input"), "12a3");
    fireEvent.press(screen.getByTestId("icp-followee-add-button"));

    expect(transaction.followeesIds).toEqual(["123"]);
  });

  it("refuses to add a followee the list already holds", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: ["7"] };

    renderScreen();
    fireEvent.changeText(screen.getByTestId("icp-followee-input"), "7");
    fireEvent.press(screen.getByTestId("icp-followee-add-button"));

    expect(updateTransaction).not.toHaveBeenCalled();
  });

  // There is no per-followee delete call: removing one means submitting the rest.
  it("submits the remaining followees when one is removed", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: ["7", "8"] };

    renderScreen();
    fireEvent.press(screen.getAllByText("Remove")[0]);

    expect(transaction.followeesIds).toEqual(["8"]);
  });

  it("says the neuron will not vote while the list is empty", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: [] };

    renderScreen();

    expect(screen.getByText(/will not vote on this topic/)).toBeVisible();
  });
});

/*
 * Submitting an empty list is how a topic is cleared, since the canister replaces the whole list per
 * call. Worth allowing, but it is destructive, and the neutral empty-state copy read like a no-op.
 */
describe("Followees clearing a topic", () => {
  beforeEach(() => {
    updateTransaction.mockClear();
  });

  it("says an empty list will stop the neuron following, when it currently follows someone", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: [] };
    neuron = makeHealthyNeuron({ followees: [{ topic: GOVERNANCE, followeeIds: [42n, 99n] }] });

    renderScreen();

    expect(screen.getByText(/stops this neuron following anyone on Governance/)).toBeVisible();
    expect(screen.queryByText(/will not vote on this topic/)).toBeNull();
  });

  it("allows that clearing submission", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: [] };
    neuron = makeHealthyNeuron({ followees: [{ topic: GOVERNANCE, followeeIds: [42n] }] });

    renderScreen();

    expect(screen.getByTestId("icp-continue-button")).toBeEnabled();
  });

  // An empty list over an empty list is a device confirmation that changes nothing.
  it("refuses a submission that would clear nothing", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: [] };
    neuron = makeHealthyNeuron({ followees: [] });

    renderScreen();

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  it("counts only the followees on the topic being edited", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: [] };
    neuron = makeHealthyNeuron({ followees: [{ topic: GOVERNANCE + 1, followeeIds: [42n] }] });

    renderScreen();

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });
});
