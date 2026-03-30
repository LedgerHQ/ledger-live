import React from "react";
import { render } from "@tests/test-renderer";
import { track } from "~/analytics";
import { MockDrawerComponent } from "./shared";
import { REBORN_BUY_DRAWER_ANALYTICS_PAGE } from "../consts/analytics";

describe("Reborn Buy Device Drawer", () => {
  it("Should render reborn drawer", async () => {
    const { user, getByRole, getByTestId } = render(<MockDrawerComponent />);
    const drawerButton = await getByTestId("reborn-test-button");

    await user.press(drawerButton);

    expect(getByRole("button", { name: /Connect/i })).toBeVisible();
    expect(getByRole("button", { name: /Buy your ledger device/i })).toBeVisible();
  });

  it("when connect button clicked should call tracking correctly", async () => {
    const { user, getByTestId, getByRole } = render(<MockDrawerComponent />);
    const drawerButton = await getByTestId("reborn-test-button");

    await user.press(drawerButton);

    await user.press(getByRole("button", { name: /Connect/i }));
    expect(track).toHaveBeenCalledWith("drawer_opened", {
      flow: "reborn",
      page: REBORN_BUY_DRAWER_ANALYTICS_PAGE,
    });

    expect(track).toHaveBeenNthCalledWith(4, "button_clicked", {
      button: "Connect",
      page: REBORN_BUY_DRAWER_ANALYTICS_PAGE,
    });
  });

  it("when buy device button clicked should call tracking correctly", async () => {
    const { user, getByTestId, getByRole } = render(<MockDrawerComponent />);
    const drawerButton = await getByTestId("reborn-test-button");

    await user.press(drawerButton);

    await user.press(getByRole("button", { name: /Buy your ledger device/i }));
    expect(track).toHaveBeenNthCalledWith(8, "button_clicked", {
      button: "buy a ledger device",
      page: REBORN_BUY_DRAWER_ANALYTICS_PAGE,
    });
  });
});
