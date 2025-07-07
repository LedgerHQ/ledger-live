import React from "react";
import ModularDrawerScreenDebug from "../Debug";
import { render } from "@tests/test-renderer";

describe("ModularDrawer integration flow", () => {
  it("opens the drawer at step 1, goes to step 2, goes back to step 1, then navigates to step 3", async () => {
    const { getByText, getByTestId, user } = render(<ModularDrawerScreenDebug />);

    // Open the drawer
    await user.press(getByText("Open MAD Drawer"));

    expect(getByText(/select asset/i)).toBeVisible();

    await user.press(getByText("Next"));
    expect(getByText(/select network/i)).toBeVisible();

    await user.press(getByTestId("modal-back-button"));

    expect(getByText(/select asset/i)).toBeVisible();

    await user.press(getByText("Next"));
    expect(getByText(/select network/i)).toBeVisible();

    await user.press(getByText("Next"));
    expect(getByText(/select account/i)).toBeVisible();
  });
});
