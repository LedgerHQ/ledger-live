import React from "react";
import { render, screen } from "@tests/test-renderer";
import DeviceOnboardingDebug from "./index";

const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack }),
}));

describe("DeviceOnboardingDebug", () => {
  it("should open on the idle checks screen", () => {
    render(<DeviceOnboardingDebug />);

    expect(
      screen.getByText("Let's confirm that your Ledger device is genuine and up-to-date."),
    ).toBeVisible();
  });

  it("should show the succeeded screen when that state is selected", async () => {
    const { user } = render(<DeviceOnboardingDebug />);

    await user.press(screen.getByRole("button", { name: "Close" }));
    await user.press(screen.getByRole("button", { name: "succeeded" }));

    expect(screen.getByText("Device genuine and up-to-date")).toBeVisible();
  });

  it("should leave the preview from the state list back button", async () => {
    const { user } = render(<DeviceOnboardingDebug />);

    await user.press(screen.getByRole("button", { name: "Close" }));
    await user.press(screen.getByRole("button", { name: "Back" }));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("should move to the checking screen when the call to action is pressed", async () => {
    const { user } = render(<DeviceOnboardingDebug />);

    await user.press(screen.getByRole("button", { name: "Check my device" }));

    expect(screen.getByText("Check your device")).toBeVisible();
  });
});
