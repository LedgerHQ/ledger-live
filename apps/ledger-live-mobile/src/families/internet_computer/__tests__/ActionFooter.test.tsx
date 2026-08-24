import { render, screen } from "@tests/test-renderer";
import React from "react";
import ActionFooter from "../components/ActionFooter";

// Shaped like the coin module's error classes: the message defaults to the class name, and the
// bounds travel as enumerable fields for the copy to interpolate.
const makeError = (name: string, fields: Record<string, unknown> = {}) =>
  Object.assign(new Error(name), { name, ...fields });

const renderFooter = (errors: Record<string, Error>, showAmountError?: boolean) =>
  render(
    <ActionFooter
      status={{ errors, warnings: {} } as never}
      bridgePending={false}
      onContinue={jest.fn()}
      showAmountError={showAmountError}
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

  // The bridge faults a zero amount, so an amount screen used to open with a red error against a
  // field nobody had typed in yet.
  it("says nothing about the amount while the amount is untouched, but still blocks Continue", () => {
    renderFooter({ amount: makeError("NotEnoughTransferAmount") }, false);

    expect(screen.queryByText("Amount too small")).toBeNull();
    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  it("still reports an error that is not about the amount", () => {
    renderFooter({ transaction: makeError("ICPStakeMemoNotRecoverable") }, false);

    expect(screen.getByText("Cannot top up this neuron")).toBeVisible();
  });

  it("reports the amount error once the amount has been entered", () => {
    renderFooter({ amount: makeError("NotEnoughTransferAmount") }, true);

    expect(screen.getByText("Amount too small")).toBeVisible();
  });
});
