/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import DeletionFinalStep from "../screens/ManageInstances/04-DeletionFinalStep";
import { INSTANCES } from "./shared";

describe("DeletionFinalStep", () => {
  it("should show instance-removal success message with instance name, not Sync complete", () => {
    const instance = INSTANCES[1];
    render(<DeletionFinalStep instance={instance} />);

    expect(
      screen.getByText("Your Ledger Wallet app on Ipone 15 is no longer connected to Ledger Sync"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Sync complete")).not.toBeInTheDocument();
  });
});
