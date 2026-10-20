import React from "react";
import { render, screen } from "@tests/test-renderer";
import { UnknownErrorState } from "./UnknownErrorState";

describe("UnknownErrorState", () => {
  it("should render the shared unknown error wording", () => {
    render(<UnknownErrorState />);

    expect(screen.getByText("Unknown error")).toBeVisible();
    expect(
      screen.getByText("Try again or contact Ledger support if the issue continues."),
    ).toBeVisible();
    expect(screen.getByTestId("device-intent-executor-connect-device-unknown-error")).toBeVisible();
  });
});
