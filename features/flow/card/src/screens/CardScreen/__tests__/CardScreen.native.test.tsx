import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardScreen } from "../index.native";

describe("CardScreen (Native)", () => {
  it("renders the card title", () => {
    render(<CardScreen />);

    expect(screen.getByText("Card playground")).toBeTruthy();
  });

  it("renders the card description", () => {
    render(<CardScreen />);

    expect(screen.getByText("Card flow scaffold by design system")).toBeTruthy();
  });
});
