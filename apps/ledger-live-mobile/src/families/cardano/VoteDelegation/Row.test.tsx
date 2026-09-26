import React from "react";
import { screen, fireEvent } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import VoteDelegationRow from "./Row";

describe("VoteDelegationRow", () => {
  it("renders correctly and responds to press", () => {
    const mockOnPress = jest.fn();
    const dRepHex = "11223344556677889900aabbccddeeff00112233445566778899aabb";
    const dRepBech32 = "drep1zy3rx3z4vemc3xgq42aueh0wluqpzg3ng32kvaugnx4tkttkftx";

    render(
      <VoteDelegationRow
        delegation={{ dRepHex, status: "delegated" } as any}
        currencyId="cardano"
        onPress={mockOnPress}
        isLast={false}
      />
    );

    // Should display the DRep id
    expect(screen.getByText(dRepBech32)).toBeDefined();

    // Should display "See more" text
    expect(screen.getByText("See more")).toBeDefined();

    // Fire press event
    fireEvent.press(screen.getByText(dRepBech32));

    // Should call onPress with the correct hex
    expect(mockOnPress).toHaveBeenCalledWith(dRepHex);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
