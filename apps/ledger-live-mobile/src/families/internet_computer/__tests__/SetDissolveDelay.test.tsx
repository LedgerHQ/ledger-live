import {
  NNS_MAXIMUM_DISSOLVE_DELAY,
  NNS_MINIMUM_DISSOLVE_DELAY,
  NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE,
  SECONDS_IN_DAY,
} from "@ledgerhq/live-common/families/internet_computer/consts";
import type {
  ICPNeuron,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { fireEvent, render, screen } from "@tests/test-renderer";
import React from "react";
import SetDissolveDelay, { MAX_DAYS } from "../NeuronManageFlow/SetDissolveDelay";
import { makeHealthyNeuron } from "./testUtils";

let transaction: Partial<Transaction> = { type: "set_dissolve_delay" };
let neuron: ICPNeuron | undefined = makeHealthyNeuron();
let status: { errors: Record<string, Error>; warnings: Record<string, Error> } = {
  errors: {},
  warnings: {},
};

// Shaped like the coin module's error classes: the message defaults to the class name, and the bound
// travels as enumerable fields for the copy to interpolate. `count` repeats the day figure because
// that is what i18next selects the plural form on.
const MIN_DAYS = NNS_MINIMUM_DISSOLVE_DELAY / SECONDS_IN_DAY;

const tooShort = Object.assign(new Error("ICPDissolveDelayLTMin"), {
  name: "ICPDissolveDelayLTMin",
  minSeconds: NNS_MINIMUM_DISSOLVE_DELAY,
  minDays: MIN_DAYS,
  count: MIN_DAYS,
});

// The fixture neuron is already locked for the 14-day voting minimum, so an increase may only add
// the rest of the two-year allowance.
const REMAINING_DAYS = Math.floor(
  (NNS_MAXIMUM_DISSOLVE_DELAY - NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE) / SECONDS_IN_DAY,
);
const mockUpdateTransaction = jest.fn((updater: (t: object) => object) => {
  transaction = updater(transaction) as Partial<Transaction>;
});
const mockNavigate = jest.fn();

const mockBackToList = jest.fn();

jest.mock("../NeuronManageFlow/useNeuronAction", () => ({
  useNeuronAction: () => ({
    account: {},
    neuron,
    backToList: mockBackToList,
    transaction,
    updateTransaction: mockUpdateTransaction,
    status,
    bridgePending: false,
    continueToDevice: mockNavigate,
  }),
}));

const renderScreen = () =>
  render(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <SetDissolveDelay navigation={{} as any} route={{ params: {} } as any} />,
  );

const enter = (value: string) => {
  fireEvent.changeText(screen.getByTestId("icp-dissolve-delay-input"), value);
};

describe("SetDissolveDelay", () => {
  beforeEach(() => {
    transaction = { type: "set_dissolve_delay" };
    neuron = makeHealthyNeuron();
    status = { errors: {}, warnings: {} };
    mockUpdateTransaction.mockClear();
  });

  // The bridge faults an absent delay, so the screen opened accusing a field with nothing in it.
  // Seeded before render: the transaction lives in a module-level mock, so a fireEvent entry never
  // re-renders the screen.
  it("does not fault the delay before anything has been entered", () => {
    status = { errors: { transaction: tooShort }, warnings: {} };

    renderScreen();

    expect(screen.queryByText("Dissolve delay too short")).toBeNull();
  });

  it("faults the delay once a value has been entered", () => {
    transaction = {
      type: "increase_dissolve_delay",
      additionalDissolveDelay: String(SECONDS_IN_DAY),
    };
    status = { errors: { transaction: tooShort }, warnings: {} };

    renderScreen();

    expect(screen.getByText("Dissolve delay too short")).toBeVisible();
  });

  it("quotes the bound in days in the fault it reports", () => {
    transaction = {
      type: "increase_dissolve_delay",
      additionalDissolveDelay: String(SECONDS_IN_DAY),
    };
    status = { errors: { transaction: tooShort }, warnings: {} };

    renderScreen();

    expect(
      screen.getByText(
        `The Internet Computer requires a dissolve delay of at least ${MIN_DAYS} days.`,
      ),
    ).toBeVisible();
  });

  it("stores the entered days as seconds", () => {
    renderScreen();

    enter("30");

    expect(transaction.dissolveDelay).toBe(String(30 * SECONDS_IN_DAY));
  });

  it("clamps a value above the protocol maximum", () => {
    renderScreen();

    enter("99999");

    expect(transaction.dissolveDelay).toBe(String(MAX_DAYS * SECONDS_IN_DAY));
  });

  // The field holds its own text rather than reading it back out of the transaction: that round-trip
  // runs prepareTransaction and getTransactionStatus, debounced by 300ms, and keystrokes arriving
  // before it lands were discarded when the stale value was pushed back to the input — "9999" reached
  // the screen as "9". This mock never re-renders on an update, so the displayed value and the
  // preview can only be right if they come from the screen's own state.
  it("shows the clamped entry without waiting for the transaction to echo it back", () => {
    renderScreen();

    enter("99999");

    expect(screen.getByTestId("icp-dissolve-delay-input")).toHaveDisplayValue(String(MAX_DAYS));
    expect(screen.getByText("New dissolve delay: 1 year, 11 months")).toBeVisible();
  });

  it("clamps a pasted value too large for Number without throwing", () => {
    renderScreen();

    // Number() turns this into Infinity, which BigInt() then rejects while the delay renders.
    expect(() => enter("9".repeat(400))).not.toThrow();
    expect(transaction.dissolveDelay).toBe(String(MAX_DAYS * SECONDS_IN_DAY));
  });

  it("strips anything that is not a digit", () => {
    renderScreen();

    enter("1.5abc");

    expect(transaction.dissolveDelay).toBe(String(15 * SECONDS_IN_DAY));
  });

  it("clears the field back to empty rather than storing zero", () => {
    renderScreen();

    enter("");

    expect(transaction.dissolveDelay).toBe("");
  });

  it("adds to the current delay when the action is an increase", () => {
    transaction = { type: "increase_dissolve_delay", additionalDissolveDelay: "" };
    renderScreen();

    enter("10");

    expect(transaction.additionalDissolveDelay).toBe(String(10 * SECONDS_IN_DAY));
    expect(transaction.dissolveDelay).toBeUndefined();
  });

  // The bridge rejects `current + additional > max`, so the room left under the cap is the real
  // bound. Clamping an increase to the absolute maximum still let the total overshoot it.
  it("clamps an increase to the room left under the maximum, not to the maximum itself", () => {
    transaction = { type: "increase_dissolve_delay", additionalDissolveDelay: "" };
    renderScreen();

    enter("99999");

    expect(transaction.additionalDissolveDelay).toBe(String(REMAINING_DAYS * SECONDS_IN_DAY));
    expect(transaction.additionalDissolveDelay).not.toBe(String(MAX_DAYS * SECONDS_IN_DAY));
  });

  it("quotes the days still available to add rather than the absolute cap", () => {
    transaction = { type: "increase_dissolve_delay", additionalDissolveDelay: "" };
    renderScreen();

    expect(
      screen.getByText(`add up to ${REMAINING_DAYS} more days`, { exact: false }),
    ).toBeVisible();
  });

  // Reachable only if the neuron hits the cap while the screen is open — NeuronDetails stops offering
  // the action — but the entry has to collapse to a value the footer refuses rather than submit.
  it("leaves nothing to enter for a neuron already at the maximum", () => {
    neuron = makeHealthyNeuron({
      dissolveState: { DissolveDelaySeconds: BigInt(NNS_MAXIMUM_DISSOLVE_DELAY) },
    });
    transaction = { type: "increase_dissolve_delay", additionalDissolveDelay: "" };
    renderScreen();

    enter("5");

    expect(transaction.additionalDissolveDelay).toBe("0");
  });

  it('keeps Continue disabled for a zero-day delay, which stores a truthy "0"', () => {
    transaction = { type: "set_dissolve_delay", dissolveDelay: "0" };
    renderScreen();

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  it("enables Continue once a positive delay is entered", () => {
    transaction = { type: "set_dissolve_delay", dissolveDelay: String(30 * SECONDS_IN_DAY) };
    renderScreen();

    expect(screen.getByTestId("icp-continue-button")).toBeEnabled();
  });

  it("warns while the resulting delay would leave the neuron unable to vote", () => {
    transaction = { type: "set_dissolve_delay", dissolveDelay: String(SECONDS_IN_DAY) };
    renderScreen();

    expect(screen.getByText(/cannot vote/, { exact: false })).toBeVisible();
  });

  it("still warns a day short of the voting threshold", () => {
    transaction = {
      type: "set_dissolve_delay",
      dissolveDelay: String(NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE - SECONDS_IN_DAY),
    };
    renderScreen();

    expect(screen.getByText(/cannot vote/, { exact: false })).toBeVisible();
  });

  // The threshold itself is eligible, so the warning has to clear exactly on it rather than one day
  // later.
  it("stops warning at exactly the voting threshold", () => {
    transaction = {
      type: "set_dissolve_delay",
      dissolveDelay: String(NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE),
    };
    renderScreen();

    expect(screen.queryByText(/cannot vote/)).toBeNull();
  });
});

// A refresh or a disburse drops a neuron from the snapshot, and this screen resolves its neuron live
// out of redux by the id in its route params — so it can lose the neuron with the user standing
// still. Rendering nothing left a blank screen.
describe("SetDissolveDelay without its neuron", () => {
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
