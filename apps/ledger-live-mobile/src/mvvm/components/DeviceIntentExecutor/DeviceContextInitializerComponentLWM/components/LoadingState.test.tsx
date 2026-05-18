import { render, screen } from "@tests/test-renderer";
import React from "react";
import { LoadingState } from "./LoadingState";

describe("LoadingState", () => {
  it("should render the loading title", () => {
    render(<LoadingState />);

    expect(screen.getByText("Loading")).toBeVisible();
  });
});
