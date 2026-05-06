import React from "react";
import { render, screen } from "@tests/test-renderer";
import { ConnectingState } from "./ConnectingState";

describe("ConnectingState", () => {
  it("should render the connecting title", () => {
    render(<ConnectingState />);

    expect(screen.getByText("Loading")).toBeVisible();
  });
});
