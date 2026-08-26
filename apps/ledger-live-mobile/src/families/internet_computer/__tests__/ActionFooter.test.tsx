import { render, screen } from "@tests/test-renderer";
import React from "react";
import ActionFooter from "../components/ActionFooter";

// Shaped like the coin module's error classes: the message defaults to the class name, and the
// bounds travel as enumerable fields for the copy to interpolate.
const makeError = (name: string, fields: Record<string, unknown> = {}) =>
  Object.assign(new Error(name), { name, ...fields });

const renderFooter = (
  errors: Record<string, Error>,
  pristineField?: "amount" | "transaction",
  warnings: Record<string, Error> = {},
) =>
  render(
    <ActionFooter
      status={{ errors, warnings } as never}
      bridgePending={false}
      onContinue={jest.fn()}
      pristineField={pristineField}
    />,
  );

describe("ActionFooter", () => {
  // createCustomErrorClass falls back to the class name when constructed with an empty message, so
  // rendering `error.message` put "ICPInvalidPercentage" in front of the user.
  it("translates the error instead of showing its class name", () => {
    renderFooter({ amount: makeError("ICPInvalidPercentage") });

    expect(screen.getByText("Percentage out of range")).toBeVisible();
    expect(screen.getByText("Enter a whole number between 1 and 100.")).toBeVisible();
    expect(screen.queryByText("ICPInvalidPercentage")).toBeNull();
  });

  it("interpolates the fields the error carries into its description", () => {
    renderFooter({
      staking: makeError("ICPDissolveDelayLTMin", { minSeconds: 604800, minDays: 7 }),
    });

    expect(screen.getByText(/at least 7 days/)).toBeVisible();
  });

  it("blocks Continue while an error is present", () => {
    renderFooter({ amount: makeError("ICPInvalidPercentage") });

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  it("enables Continue when the status is clean", () => {
    renderFooter({});

    expect(screen.getByTestId("icp-continue-button")).toBeEnabled();
  });

  // Every one of these screens arrives with its field blank, which the bridge faults, so they all
  // used to open with a red error against a field nobody had typed in yet.
  it("says nothing about the pristine field, but still blocks Continue", () => {
    renderFooter({ amount: makeError("NotEnoughTransferAmount") }, "amount");

    expect(screen.queryByText("Amount too small")).toBeNull();
    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  it("withholds a pristine transaction-level error too, which is where a hot key faults", () => {
    renderFooter({ transaction: makeError("ICPInvalidHotKey") }, "transaction");

    expect(screen.queryByText("Invalid principal")).toBeNull();
  });

  // Typing in the amount field will never recover the missing stake memo, so that one is reported
  // the moment the screen opens.
  it("reports an error against a field other than the pristine one", () => {
    renderFooter({ transaction: makeError("ICPStakeMemoNotRecoverable") }, "amount");

    expect(screen.getByText("Cannot top up this neuron")).toBeVisible();
  });

  it("reports the error once the field has an entry to fault", () => {
    renderFooter({ amount: makeError("NotEnoughTransferAmount") });

    expect(screen.getByText("Amount too small")).toBeVisible();
  });
});

/*
 * getTransactionStatus has always filed these under `warnings.staking`, and nothing read that slot:
 * the generic send flow renders `warnings.amount` and `warnings.transaction` only. So a notice raised
 * on every stake and every top-up reached no one.
 */
describe("ActionFooter staking notices", () => {
  it("shows the notice the bridge files under the staking slot", () => {
    renderFooter({}, undefined, { staking: makeError("ICPCreateNeuronWarning") });

    expect(screen.getByText("This locks your ICP in a new neuron")).toBeVisible();
    expect(screen.getByText(/shortest dissolve delay/)).toBeVisible();
  });

  it("shows the top-up notice too", () => {
    renderFooter({}, undefined, { staking: makeError("ICPIncreaseStakeWarning") });

    expect(screen.getByText("This adds to a locked stake")).toBeVisible();
  });

  // A notice is not a fault: the stake is a legitimate action and the amount is valid.
  it("does not block Continue", () => {
    renderFooter({}, undefined, { staking: makeError("ICPCreateNeuronWarning") });

    expect(screen.getByTestId("icp-continue-button")).toBeEnabled();
  });

  it("shows the notice alongside an error, which is a different field", () => {
    renderFooter({ amount: makeError("NotEnoughTransferAmount") }, undefined, {
      staking: makeError("ICPCreateNeuronWarning"),
    });

    expect(screen.getByText("This locks your ICP in a new neuron")).toBeVisible();
    expect(screen.getByText("Amount too small")).toBeVisible();
  });
});
