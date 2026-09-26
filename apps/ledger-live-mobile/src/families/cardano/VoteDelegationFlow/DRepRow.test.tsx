import React from "react";
import { screen, fireEvent } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import DRepRow from "./DRepRow";

describe("DRepRow", () => {
  const mockDRepHex = "11223344556677889900aabbccddeeff00112233445566778899aabb";
  const mockDRepBech32 = "drep1zy3rx3z4vemc3xgq42aueh0wluqpzg3ng32kvaugnx4tkttkftx";

  it("renders correctly and responds to press", () => {
    const mockOnPress = jest.fn();
    const mockDRep = {
      hex: mockDRepHex,
      meta: { givenName: "My DRep" },
      active: "2023-01-01T00:00:00.000Z",
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    render(<DRepRow drep={mockDRep} onPress={mockOnPress} currencyId="cardano" />);

    // Should display the DRep given name
    expect(screen.getByText("My DRep")).toBeDefined();

    // Fire press event
    fireEvent.press(screen.getByText("My DRep"));

    // Should call onPress with the correct drep
    expect(mockOnPress).toHaveBeenCalledWith(mockDRep);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it("renders with bech32-encoded DRep id when meta name is missing", () => {
    const mockOnPress = jest.fn();
    const mockDRep = {
      hex: mockDRepHex,
      active: "2023-01-01T00:00:00.000Z",
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    render(<DRepRow drep={mockDRep} onPress={mockOnPress} currencyId="cardano" />);

    // Should display the DRep id
    expect(screen.getByText(mockDRepBech32)).toBeDefined();
  });
});
