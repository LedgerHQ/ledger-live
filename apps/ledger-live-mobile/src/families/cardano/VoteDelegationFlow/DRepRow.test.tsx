import React from "react";
import { screen, fireEvent } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import DRepRow from "./DRepRow";

describe("DRepRow", () => {
  it("renders correctly and responds to press", () => {
    const mockOnPress = jest.fn();
    const mockDRep = {
      hex: "drep_hex_12345",
      meta: { givenName: "My DRep" },
      active: "2023-01-01T00:00:00.000Z",
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    render(<DRepRow drep={mockDRep} onPress={mockOnPress} />);

    // Should display the DRep given name
    expect(screen.getByText("My DRep")).toBeDefined();

    // Fire press event
    fireEvent.press(screen.getByText("My DRep"));
    
    // Should call onPress with the correct drep
    expect(mockOnPress).toHaveBeenCalledWith(mockDRep);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it("renders with hex when meta name is missing", () => {
    const mockOnPress = jest.fn();
    const mockDRep = {
      hex: "drep_hex_12345",
      active: "2023-01-01T00:00:00.000Z",
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    render(<DRepRow drep={mockDRep} onPress={mockOnPress} />);

    // Should display the DRep hex
    expect(screen.getByText("drep_hex_12345")).toBeDefined();
  });
});
