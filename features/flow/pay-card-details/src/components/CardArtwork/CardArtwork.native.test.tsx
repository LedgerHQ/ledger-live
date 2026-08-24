import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardArtwork } from "./CardArtwork.native";

describe("CardArtwork (native)", () => {
  it("renders nothing until the native card artwork ships", () => {
    render(<CardArtwork />);

    expect(screen.queryByTestId("card-artwork")).toBeNull();
  });
});
