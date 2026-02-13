import React from "react";
import { render } from "@tests/test-renderer";
import { track } from "~/analytics";
import { MockDrawerComponent } from "./shared";

describe("Reborn Buy Device Drawer", () => {
  it("Should render reborn drawer", async () => {
    const { user, getByTestId } = render(<MockDrawerComponent />);
    const drawerButton = await getByTestId("reborn-test-button");

    await user.press(drawerButton);

    expect(getByTestId("reborn-buy-device-cta")).toBeVisible();
    expect(getByTestId("reborn-buy-device-buyCta")).toBeVisible();
  });

  it("Should call tracking correctly", async () => {
    const { user, getByTestId } = render(<MockDrawerComponent />);
    const drawerButton = await getByTestId("reborn-test-button");

    await user.press(drawerButton);

    await user.press(getByTestId("reborn-buy-device-cta"));
    expect(track).toHaveBeenCalledWith("message_clicked", {
      message: "I already have a device, set it up now",
      page: "Upsell Flex",
    });

    await user.press(getByTestId("reborn-buy-device-buyCta"));
    expect(track).toHaveBeenCalledWith("message_clicked", {
      message: "I already have a device, set it up now",
      page: "Upsell Flex",
    });
  });
});
