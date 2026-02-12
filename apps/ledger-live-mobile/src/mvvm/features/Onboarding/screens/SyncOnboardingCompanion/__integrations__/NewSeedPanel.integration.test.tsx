import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import NewSeedPanel from "../components/NewSeedPanel";

const mockHandlePress = jest.fn();

describe("NewSeedPanel", () => {
  beforeEach(() => mockHandlePress.mockReset());

  it("Should handle confirm", async () => {
    const { user } = render(<NewSeedPanel handlePress={mockHandlePress} />);

    const confirmButton = await screen.findByTestId("new-seed-panel-confirm");
    expect(confirmButton).toBeOnTheScreen();

    await user.press(confirmButton);

    expect(mockHandlePress).toHaveBeenCalledWith(true);
  });

  it("Should handle skip", async () => {
    const { user } = render(<NewSeedPanel handlePress={mockHandlePress} />);

    const skipButton = await screen.findByTestId("new-seed-panel-skip");
    expect(skipButton).toBeVisible();

    await user.press(skipButton);

    expect(mockHandlePress).toHaveBeenCalledWith(false);
  });
});
