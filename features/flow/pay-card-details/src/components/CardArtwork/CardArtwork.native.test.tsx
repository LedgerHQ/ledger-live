import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardArtwork } from "./CardArtwork.native";

describe("CardArtwork (native)", () => {
  it("renders the card artwork and network logo", () => {
    render(<CardArtwork />);

    expect(screen.getByTestId("card-artwork")).toBeTruthy();
    expect(screen.getByTestId("card-artwork-halftone-left")).toBeTruthy();
    expect(screen.getByTestId("card-artwork-halftone-right")).toBeTruthy();
    expect(screen.getByLabelText("Visa")).toBeTruthy();
  });
});
