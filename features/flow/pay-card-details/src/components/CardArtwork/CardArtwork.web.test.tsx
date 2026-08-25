import React from "react";
import { render, screen } from "@testing-library/react";
import { CardArtwork } from "./CardArtwork";

describe("CardArtwork (web)", () => {
  it("renders the card face with the network logo", () => {
    render(<CardArtwork />);

    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.getByAltText("Visa")).toBeVisible();
  });
});
