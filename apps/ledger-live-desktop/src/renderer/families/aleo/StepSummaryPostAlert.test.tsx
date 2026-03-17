import React from "react";
import { render, screen } from "tests/testSetup";
import StepSummaryPostAlert from "./StepSummaryPostAlert";

describe("StepSummaryPostAlert", () => {
  it("should always render post alert", () => {
    render(<StepSummaryPostAlert />);

    expect(screen.getByTestId("aleo-proof-generation-warning")).toBeInTheDocument();
  });
});
