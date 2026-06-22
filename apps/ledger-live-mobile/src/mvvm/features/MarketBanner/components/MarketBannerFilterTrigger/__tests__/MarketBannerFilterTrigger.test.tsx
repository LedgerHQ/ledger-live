import React from "react";
import { render, screen } from "@tests/test-renderer";
import { MarketBannerFilterTrigger } from "..";

describe("MarketBannerFilterTrigger", () => {
  it("renders the label and calls onPress when pressed", async () => {
    const onPress = jest.fn();
    const { user } = render(
      <MarketBannerFilterTrigger label="Trending" onPress={onPress} testID="trigger" />,
    );

    expect(screen.getByText("Trending")).toBeVisible();

    await user.press(screen.getByTestId("trigger"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
