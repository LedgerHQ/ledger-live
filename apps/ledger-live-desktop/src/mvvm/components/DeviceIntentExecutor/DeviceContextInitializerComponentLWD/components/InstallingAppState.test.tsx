import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { InstallingAppState } from "./InstallingAppState";

describe("InstallingAppState", () => {
  it("GIVEN the installing app state WHEN rendering THEN it renders the installing app title", () => {
    // WHEN
    render(<InstallingAppState />);

    // THEN
    expect(screen.getByText("Installing app")).toBeVisible();
  });
});
