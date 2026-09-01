import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardArtwork } from "./CardArtwork.native";

describe("CardArtwork (native)", () => {
  it("renders the card face", () => {
    render(<CardArtwork />);

    expect(screen.getByTestId("card-artwork")).toBeTruthy();
  });
});
