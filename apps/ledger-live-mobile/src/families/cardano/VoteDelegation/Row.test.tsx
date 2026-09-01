import React from "react";
import { screen, fireEvent } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import VoteDelegationRow from "./Row";

describe("VoteDelegationRow", () => {
  it("renders correctly and responds to press", () => {
    const mockOnPress = jest.fn();
    const dRepHex = "drep_hex_12345";

    render(
      <VoteDelegationRow
        dRepHex={dRepHex}
        onPress={mockOnPress}
        isLast={false}
      />
    );

    // Should display the DRep Hex
    expect(screen.getByText(dRepHex)).toBeDefined();

    // Should display "See more" text
    expect(screen.getByText("See more")).toBeDefined();

    // Fire press event
    fireEvent.press(screen.getByText(dRepHex));
    
    // Should call onPress with the correct hex
    expect(mockOnPress).toHaveBeenCalledWith(dRepHex);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
