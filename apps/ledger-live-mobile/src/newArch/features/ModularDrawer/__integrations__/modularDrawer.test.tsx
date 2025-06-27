import React from "react";
import ModularDrawerScreenDebug from "../Debug";
import { render } from "@tests/test-renderer";

describe("ModularDrawer integration flow", () => {
  it("opens the drawer at step 1 and navigates to step 3", async () => {
    const { getByText, user } = render(<ModularDrawerScreenDebug />);

    // Open the drawer
    await user.press(getByText("Open MAD Drawer"));

    expect(getByText(/Step 1: Asset/)).toBeVisible();

    await user.press(getByText("Next"));
    expect(getByText(/Step 2: Network/)).toBeVisible();

    await user.press(getByText("Next"));
    expect(getByText(/Step 3: Account/)).toBeVisible();
  });
});
