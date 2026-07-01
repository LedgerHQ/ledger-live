import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { LoadingState } from "./LoadingState";

describe("LoadingState", () => {
  it("GIVEN the loading state WHEN rendering THEN it renders the loading title", () => {
    // WHEN
    render(<LoadingState />);

    // THEN
    expect(screen.getByText("Loading")).toBeVisible();
  });
});
