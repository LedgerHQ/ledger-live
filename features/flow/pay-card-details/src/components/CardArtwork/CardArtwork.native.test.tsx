import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardArtwork } from "./CardArtwork.native";

describe("CardArtwork (native)", () => {
  it("should render the card face", () => {
    render(<CardArtwork />);

    expect(screen.getByTestId("card-artwork")).toBeVisible();
  });
});
