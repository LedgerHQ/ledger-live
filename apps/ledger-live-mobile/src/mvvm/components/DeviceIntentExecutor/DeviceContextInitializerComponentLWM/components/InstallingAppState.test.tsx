import React from "react";
import { render, screen } from "@tests/test-renderer";
import { InstallingAppState } from "./InstallingAppState";

describe("InstallingAppState", () => {
  it("should render the installing app title", () => {
    render(<InstallingAppState />);

    expect(screen.getByText("Installing app")).toBeVisible();
  });
});
