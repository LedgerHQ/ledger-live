import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardArtwork } from "./CardArtwork.native";

describe("CardArtwork (native)", () => {
  it("should show the Visa logo when the card artwork renders", () => {
    render(<CardArtwork />);

    expect(screen.getByLabelText("Visa")).toBeVisible();
  });
});
