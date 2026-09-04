import type {
  ICPNeuron,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import React from "react";
import IncreaseStake from "../NeuronManageFlow/IncreaseStake";
import { ICP_UNIT, makeHealthyNeuron, makeICPAccount } from "./testUtils";

// 12.34567891 ICP: the fifth decimal rounds up, so a rounded format would report a maximum above
// what the bridge will actually accept.
const MAX_SPENDABLE = new BigNumber("1234567891");

let transaction: Partial<Transaction>;
let status: { errors: Record<string, Error>; warnings: Record<string, Error> };
let estimateMaxSpendable: () => Promise<BigNumber>;
let neuron: ICPNeuron | undefined;

const notEnoughBalance = Object.assign(new Error("NotEnoughBalance"), { name: "NotEnoughBalance" });

jest.mock("LLM/hooks/useAccountUnit", () => ({ useAccountUnit: () => ICP_UNIT }));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({ estimateMaxSpendable: () => estimateMaxSpendable() }),
}));
const mockBackToList = jest.fn();

jest.mock("../NeuronManageFlow/useNeuronAction", () => ({
  useNeuronAction: () => ({
    account: makeICPAccount({ neurons: [] }),
    neuron,
    backToList: mockBackToList,
    transaction,
    updateTransaction: jest.fn(),
    status,
    bridgePending: false,
    continueToDevice: jest.fn(),
  }),
}));

const renderScreen = () =>
  render(
    <IncreaseStake
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation={{} as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      route={{ params: {} } as any}
    />,
  );

describe("IncreaseStake", () => {
  beforeEach(() => {
    transaction = { type: "increase_stake", amount: new BigNumber(0) };
    status = { errors: {}, warnings: {} };
    estimateMaxSpendable = () => Promise.resolve(MAX_SPENDABLE);
    neuron = makeHealthyNeuron();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // A displayed bound must be a value the canister would accept: a rounded-up maximum invites the
  // user to type back a figure the bridge then rejects.
  it("shows the spendable maximum unrounded", async () => {
    renderScreen();

    expect(await screen.findByText("12.34567891 ICP")).toBeVisible();
    expect(screen.queryByText("12.3457 ICP")).toBeNull();
  });

  // The estimate is a network call. Left unhandled its rejection is an unhandled promise rejection,
  // which surfaces as a redbox in dev rather than as the missing hint it actually is.
  it("keeps the screen usable when the estimate cannot be computed", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    estimateMaxSpendable = () => Promise.reject(new Error("network down"));

    renderScreen();

    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(screen.getByText("Total available")).toBeVisible();
    expect(screen.queryByText("12.34567891 ICP")).toBeNull();
  });

  // The field arrives empty, which the bridge rightly rejects — but faulting an amount nobody has
  // typed yet reads as the screen having failed on arrival.
  it("withholds the amount error while the field is still empty", () => {
    status = { errors: { amount: notEnoughBalance }, warnings: {} };

    renderScreen();

    expect(screen.queryByText(/insufficient funds/i)).toBeNull();
    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  it("reports the amount error once an amount has been entered", () => {
    transaction = { type: "increase_stake", amount: new BigNumber(100) };
    status = { errors: { amount: notEnoughBalance }, warnings: {} };

    renderScreen();

    // Rendered by both the amount input and the footer beneath it.
    expect(screen.getAllByText(/insufficient funds/i).length).toBeGreaterThan(0);
  });

  it("enables Continue once a non-zero amount is set and nothing is wrong", () => {
    transaction = { type: "increase_stake", amount: new BigNumber(100) };

    renderScreen();

    expect(screen.getByTestId("icp-continue-button")).toBeEnabled();
  });
});

// A refresh or a disburse drops a neuron from the snapshot, and this screen resolves its neuron live
// out of redux by the id in its route params — so it can lose the neuron with the user standing
// still. Rendering nothing left a blank screen.
describe("IncreaseStake without its neuron", () => {
  beforeEach(() => {
    mockBackToList.mockClear();
  });

  it("explains itself instead of rendering a blank screen", () => {
    neuron = undefined;

    renderScreen();

    expect(screen.getByText(/no longer in your synced snapshot/)).toBeVisible();
  });

  it("offers the way back to the neuron list", () => {
    neuron = undefined;

    renderScreen();
    fireEvent.press(screen.getByTestId("icp-missing-neuron-back-button"));

    expect(mockBackToList).toHaveBeenCalled();
  });
});
