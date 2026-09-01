import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import DRepImage from "./DRepImage";

describe("DRepImage", () => {
  it("renders with default name when none provided", () => {
    render(<DRepImage size={40} />);
    expect(screen.getByText("-")).toBeDefined();
  });

  it("renders with the provided name", () => {
    render(<DRepImage size={40} name="DRepName" />);
    // FirstLetterIcon will render the first letter, but testing library text matching might match the exact text or just the first letter based on the component's implementation.
    // Assuming FirstLetterIcon renders the label or the first letter.
    expect(screen.getByText("D")).toBeDefined();
  });
});
