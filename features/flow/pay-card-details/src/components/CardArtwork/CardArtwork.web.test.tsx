import React from "react";
import { render, screen } from "@testing-library/react";
import { CardArtwork } from "./CardArtwork";

describe("CardArtwork (web)", () => {
  it("should show the Visa logo when the card artwork renders", () => {
    render(<CardArtwork />);

    expect(screen.getByLabelText("Visa")).toBeVisible();
  });
});
