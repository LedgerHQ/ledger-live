import type { Transaction } from "@ledgerhq/live-common/families/internet_computer/types";
import { fireEvent, render, screen } from "@tests/test-renderer";
import React from "react";
import StakeMaturity from "../NeuronManageFlow/StakeMaturity";
import { ICP_UNIT, makeHealthyNeuron } from "./testUtils";

jest.mock("LLM/hooks/useAccountUnit", () => ({ useAccountUnit: () => ICP_UNIT }));

const ICP = 100_000_000n;

let transaction: Partial<Transaction> = { type: "stake_maturity" };
const neuron = makeHealthyNeuron({ maturityE8sEquivalent: 4n * ICP });
const mockUpdateTransaction = jest.fn((updater: (t: object) => object) => {
  transaction = updater(transaction) as Partial<Transaction>;
});

jest.mock("../NeuronManageFlow/useNeuronAction", () => ({
  useNeuronAction: () => ({
    account: {},
    neuron,
    transaction,
    updateTransaction: mockUpdateTransaction,
    status: { errors: {}, warnings: {} },
    bridgePending: false,
    continueToDevice: jest.fn(),
  }),
}));

const renderScreen = () =>
  render(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <StakeMaturity navigation={{} as any} route={{ params: {} } as any} />,
  );

const enter = (value: string) => {
  fireEvent.changeText(screen.getByTestId("icp-stake-maturity-input"), value);
};

describe("StakeMaturity", () => {
  beforeEach(() => {
    transaction = { type: "stake_maturity" };
    mockUpdateTransaction.mockClear();
  });

  it("clamps a percentage above 100 instead of truncating the digits", () => {
    renderScreen();

    enter("999");

    expect(transaction.percentageToStake).toBe("100");
  });

  it("previews the share of maturity the entered percentage selects", () => {
    transaction = { type: "stake_maturity", percentageToStake: "25" };
    renderScreen();

    expect(screen.getByText(/^1\b/)).toBeVisible();
  });

  it("strips anything that is not a digit", () => {
    renderScreen();

    enter("5x0");

    expect(transaction.percentageToStake).toBe("50");
  });

  it("keeps Continue disabled at zero, which the canister rejects", () => {
    transaction = { type: "stake_maturity", percentageToStake: "0" };
    renderScreen();

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  it("keeps Continue disabled while the field is empty", () => {
    renderScreen();

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  it("enables Continue for a percentage in range", () => {
    transaction = { type: "stake_maturity", percentageToStake: "50" };
    renderScreen();

    expect(screen.getByTestId("icp-continue-button")).toBeEnabled();
  });
});
