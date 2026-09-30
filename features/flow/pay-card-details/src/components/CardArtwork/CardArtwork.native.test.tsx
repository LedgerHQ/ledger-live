import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardArtwork } from "./CardArtwork.native";

describe("CardArtwork (native)", () => {
  it("should render the card face", () => {
    render(<CardArtwork />);

    expect(screen.getByTestId("card-artwork")).toBeVisible();
  });

  it("should fade the card face into the page when faded", () => {
    render(<CardArtwork isFaded />);

    expect(screen.getByTestId("card-visual-fade")).toBeOnTheScreen();
  });
});
