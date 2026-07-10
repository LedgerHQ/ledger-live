import React from "react";
import { render, screen } from "tests/testSetup";
import PayTab from "..";

describe("PayTab", () => {
  it("should render registered Card components", async () => {
    render(<PayTab />);

    expect(await screen.findByText("Card Playground")).toBeVisible();
  });
});
