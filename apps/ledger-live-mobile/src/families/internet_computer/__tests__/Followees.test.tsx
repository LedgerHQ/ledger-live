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
      route={{ params: { followTopic: "Governance" } } as any}
    />,
  );

describe("Followees", () => {
  beforeEach(() => {
    transaction = { type: "follow" };
    neuron = makeHealthyNeuron({ followees: [] });
    updateTransaction.mockClear();
  });

  // The canister replaces the whole list per `follow` call, so an unseeded submit would clear every
  // followee the neuron already had rather than leaving them untouched.
  it("seeds the list from the followees the neuron already has on this topic", () => {
    neuron = makeHealthyNeuron({ followees: [{ topic: GOVERNANCE, followeeIds: [42n, 99n] }] });

    renderScreen();

    expect(transaction.followeesIds).toEqual(["42", "99"]);
    expect(transaction.followTopic).toBe("Governance");
  });

  it("ignores followees the neuron holds on other topics", () => {
    neuron = makeHealthyNeuron({ followees: [{ topic: GOVERNANCE + 1, followeeIds: [42n] }] });

    renderScreen();

    expect(transaction.followeesIds).toEqual([]);
  });

  // Reseeding would silently undo the edit the user just made.
  it("leaves an already-edited list alone", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: ["7"] };

    renderScreen();

    expect(updateTransaction).not.toHaveBeenCalled();
    expect(transaction.followeesIds).toEqual(["7"]);
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
