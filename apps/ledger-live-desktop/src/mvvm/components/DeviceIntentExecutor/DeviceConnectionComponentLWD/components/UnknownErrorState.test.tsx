import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";

import { UnknownErrorState } from "./UnknownErrorState";

describe("UnknownErrorState", () => {
  it("GIVEN an unexpected error escapes WHEN rendering THEN it shows the generic intent error copy", () => {
    // WHEN
    render(<UnknownErrorState />);

    // THEN
    expect(screen.getByText("Unknown error")).toBeVisible();
    expect(
      screen.getByText(
        "An error occurred. Please try again or contact Ledger support if the issue persists.",
      ),
    ).toBeVisible();
  });
});
