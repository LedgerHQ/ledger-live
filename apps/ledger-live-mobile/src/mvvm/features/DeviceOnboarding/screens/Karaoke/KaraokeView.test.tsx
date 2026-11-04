import React from "react";
import { render, screen } from "@tests/test-renderer";
import { karaokeTestIds } from "LLM/features/DeviceOnboarding/testIds";
import { KaraokeScreen } from "./index";

describe("KaraokeScreen", () => {
  it("should show only the close button", async () => {
    const onClose = jest.fn();
    const { user } = render(<KaraokeScreen onClose={onClose} />);

    expect(screen.getByTestId(karaokeTestIds.screen)).toBeVisible();
    expect(screen.getAllByRole("button")).toHaveLength(1);

    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
