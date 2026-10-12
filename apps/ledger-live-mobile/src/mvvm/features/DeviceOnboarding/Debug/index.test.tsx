import React from "react";
import { render, screen } from "@tests/test-renderer";
import DeviceOnboardingDebug from "./index";

describe("DeviceOnboardingDebug", () => {
  it("should open on the idle checks screen", () => {
    render(<DeviceOnboardingDebug />);

    expect(
      screen.getByText(
        "We'll confirm this device is genuine and that its operating system is up to date.",
      ),
    ).toBeVisible();
  });

  it("should show the succeeded screen when that state is selected", async () => {
    const { user } = render(<DeviceOnboardingDebug />);

    await user.press(screen.getByRole("button", { name: "succeeded" }));

    expect(screen.getByText("Your device is genuine and up to date")).toBeVisible();
  });

  it("should move to the checking screen when the call to action is pressed", async () => {
    const { user } = render(<DeviceOnboardingDebug />);

    await user.press(screen.getByRole("button", { name: "Check my device" }));

    expect(screen.getByText("Checking your device")).toBeVisible();
  });
});
