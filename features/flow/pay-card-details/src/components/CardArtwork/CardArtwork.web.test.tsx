import React from "react";
import { render, screen } from "@testing-library/react";
import { CardArtwork } from "./CardArtwork";

describe("CardArtwork (web)", () => {
  it("should render the card face", () => {
    render(<CardArtwork />);

    expect(screen.getByTestId("card-artwork")).toBeVisible();
  });
});
