import React from "react";
import { render } from "@tests/test-renderer";
import { track } from "~/analytics";
import { MockDrawerComponent } from "./shared";

describe("Reborn Buy Device Drawer", () => {
  it("Should render reborn drawer", async () => {
    const { user, getByRole, getByText } = render(<MockDrawerComponent />);

    await user.press(getByRole("button"));

    expect(getByText(/you need a ledger/i)).toBeVisible();
    expect(getByText(/buy your ledger now/i)).toBeVisible();
    expect(getByText(/i already have a ledger, set it up/i)).toBeVisible();
  });

  it("Should call tracking correctly", async () => {
    const { user, getByText, getByRole } = render(<MockDrawerComponent />);
    await user.press(getByRole("button"));

    await user.press(getByText(/i already have a ledger, set it up/i));
    expect(track).toHaveBeenCalledWith("message_clicked", {
      message: "I already have a device, set it up now",
      page: "Upsell Flex",
    });

    await user.press(getByText(/buy your ledger now/i));
    expect(track).toHaveBeenCalledWith("message_clicked", {
      message: "I already have a device, set it up now",
      page: "Upsell Flex",
    });
  });
});
