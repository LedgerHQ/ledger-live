import React from "react";
import { render, screen } from "@tests/test-renderer";
import { LoadingState } from "./LoadingState";

describe("LoadingState", () => {
  it("should render the loading title", () => {
    render(<LoadingState />);

    expect(screen.getByText("Loading")).toBeVisible();
  });
});
