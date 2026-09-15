import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardNumbersView } from "./CardNumbersView.native";
import type { CardNumbersViewProps } from "../../types";

const props: CardNumbersViewProps = {
  status: "idle",
  imageUrl: undefined,
  onReveal: jest.fn(),
  onHide: jest.fn(),
  onImageError: jest.fn(),
};

describe("CardNumbersView (native)", () => {
  it("should render nothing when the mobile reveal UI has not shipped", () => {
    render(<CardNumbersView {...props} />);

    expect(screen.queryByTestId("card-numbers")).not.toBeOnTheScreen();
  });
});
