import React from "react";
import { cleanup, render, screen } from "@testing-library/react-native";
import { CardScreen } from "../index.native";

function renderCardScreen() {
  return render(<CardScreen />);
}

describe("CardScreen (Native)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the card title", () => {
    renderCardScreen();

    expect(screen.getByText("Card playground")).toBeTruthy();
  });

  it("renders the card description", () => {
    renderCardScreen();

    expect(screen.getByText("Card flow scaffold by design system")).toBeTruthy();
  });
});
