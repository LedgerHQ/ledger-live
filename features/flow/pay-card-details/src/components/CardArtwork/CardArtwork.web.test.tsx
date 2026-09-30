import React from "react";
import { render, screen } from "@testing-library/react";
import { CardArtwork } from "./CardArtwork";

describe("CardArtwork (web)", () => {
  it("should render the card face", () => {
    render(<CardArtwork />);

    expect(screen.getByTestId("card-artwork")).toBeVisible();
  });

  it("should fade the card face into the page when faded", () => {
    render(<CardArtwork isFaded />);

    expect(screen.getByTestId("card-artwork")).toHaveAttribute("data-faded", "true");
  });

  it("should render the large card face", () => {
    render(<CardArtwork size="lg" />);

    expect(screen.getByTestId("card-artwork")).toHaveClass("w-[387px]");
  });
});
