import React from "react";
import { render, screen } from "@tests/test-renderer";
import DeviceOnboardingDebug from "./index";

jest.mock("~/components/QueuedDrawer", () => {
  const { View } = jest.requireActual("react-native");

  return function QueuedDrawerMock({
    isRequestingToBeOpened,
    children,
  }: {
    isRequestingToBeOpened?: boolean;
    children?: React.ReactNode;
  }) {
    return isRequestingToBeOpened ? <View>{children}</View> : null;
  };
});

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

  it("should show the sync offer when that preview is selected", async () => {
    const { user } = render(<DeviceOnboardingDebug />);

    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(screen.getByText("Checks")).toBeVisible();
    expect(screen.getByText("Ledger Sync")).toBeVisible();

    await user.press(screen.getByRole("button", { name: "offer" }));

    expect(screen.getByText("Sync your wallet")).toBeVisible();
    expect(screen.getByRole("button", { name: "Skip for now" })).toBeVisible();
  });

  it("should leave the preview from the state list back button", async () => {
    const { user } = render(<DeviceOnboardingDebug />);

    await user.press(screen.getByRole("button", { name: "Close" }));
    await user.press(screen.getByRole("button", { name: "Back" }));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("should open the declined error over the checking screen", async () => {
    const { user } = render(<DeviceOnboardingDebug />);

    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(screen.getByText("Errors")).toBeVisible();

    await user.press(screen.getByRole("button", { name: "declined" }));

    expect(screen.getByText("Check your device")).toBeVisible();
    expect(screen.getByText("Ledger Genuine Check error")).toBeVisible();
  });

  it("should return to the checking screen when retry is pressed", async () => {
    const { user } = render(<DeviceOnboardingDebug />);

    await user.press(screen.getByRole("button", { name: "Close" }));
    await user.press(screen.getByRole("button", { name: "declined" }));
    await user.press(screen.getByText("Try again"));

    expect(screen.getByText("Check your device")).toBeVisible();
    expect(screen.queryByText("Ledger Genuine Check error")).toBeNull();
  });

  it("should move to the checking screen when the call to action is pressed", async () => {
    const { user } = render(<DeviceOnboardingDebug />);

    await user.press(screen.getByRole("button", { name: "Check my device" }));

    expect(screen.getByText("Check your device")).toBeVisible();
  });
});
