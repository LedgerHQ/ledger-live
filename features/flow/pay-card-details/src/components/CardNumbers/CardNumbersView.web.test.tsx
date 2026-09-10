import React from "react";
import { render, screen } from "@testing-library/react";
import { CardNumbersView } from "./CardNumbersView";
import type { CardNumbersViewProps } from "../../types";

const props: CardNumbersViewProps = {
  status: "idle",
  imageUrl: undefined,
  onReveal: jest.fn(),
  onHide: jest.fn(),
  onImageError: jest.fn(),
};

describe("CardNumbersView (web)", () => {
  it("renders nothing until the desktop reveal UI ships", () => {
    render(<CardNumbersView {...props} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
