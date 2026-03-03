import React from "react";
import { render } from "@tests/test-renderer";
import { track } from "~/analytics";
import { MockDrawerComponent } from "./shared";

describe("Reborn Buy Device Drawer", () => {
  it("Should render reborn drawer", async () => {
    const { user, getByRole, getByTestId } = render(<MockDrawerComponent />);
    const drawerButton = await getByTestId("reborn-test-button");

    await user.press(drawerButton);

    expect(getByRole("button", { name: /Connect/i })).toBeVisible();
    expect(getByRole("button", { name: /Buy your ledger device/i })).toBeVisible();
  });

  it("Should call tracking correctly", async () => {
    const { user, getByTestId, getByRole } = render(<MockDrawerComponent />);
    const drawerButton = await getByTestId("reborn-test-button");

    await user.press(drawerButton);

    await user.press(getByRole("button", { name: /Connect/i }));
    expect(track).toHaveBeenCalledWith("message_clicked", {
      message: "I already have a device, set it up now",
      page: "Upsell Flex",
    });

    await user.press(getByRole("button", { name: /Buy your ledger device/i }));
    expect(track).toHaveBeenCalledWith("message_clicked", {
      message: "I already have a device, set it up now",
      page: "Upsell Flex",
    });
  });
});
