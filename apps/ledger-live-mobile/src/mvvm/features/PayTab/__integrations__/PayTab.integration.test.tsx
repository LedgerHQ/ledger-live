import React from "react";
import { render, screen } from "@tests/test-renderer";
import { PayTabScreen } from "../screens/PayTab";

describe("PayTabScreen", () => {
  it("should render registered Card components", async () => {
    render(<PayTabScreen />);

    expect(await screen.findByText("Card Playground")).toBeOnTheScreen();
  });
});
