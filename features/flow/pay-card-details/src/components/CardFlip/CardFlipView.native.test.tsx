import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardFlipView } from "./CardFlipView.native";
import type { CardFlipViewProps } from "../../types";

const props: CardFlipViewProps = {
  status: "idle",
  isRevealed: false,
  imageUrl: undefined,
  onReveal: jest.fn(),
  onHide: jest.fn(),
  onImageError: jest.fn(),
};

describe("CardFlipView (native)", () => {
  it("should render nothing when the mobile reveal UI has not shipped", () => {
    render(<CardFlipView {...props} />);

    expect(screen.queryByTestId("card-flip")).not.toBeOnTheScreen();
  });
});
