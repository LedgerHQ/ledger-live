import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DebugLottieDeviceTab } from "../DebugLottieDeviceTab";

jest.mock("~/components/Animation", () => {
  const ReactNative = require("react-native");
  return ({ testID = "mock-animation" }: { testID?: string }) => (
    <ReactNative.View testID={testID} />
  );
});

jest.mock("~/helpers/getDeviceAnimation", () => ({
  getAnimationKeysForDeviceModelId: jest.fn(() => ["deviceAnim"]),
  getDeviceAnimation: jest.fn(({ theme }) => ({ uri: `file://device-${theme}.lottie` })),
}));

jest.mock("../../../../Onboarding/shared/infoPagesData", () => ({
  getAnimationKeysForDeviceModelId: jest.fn(() => ["onboardingAnim"]),
  getOnboardingDeviceAnimation: jest.fn(({ theme }) => ({ uri: `file://onboarding-${theme}.lottie` })),
}));

describe("DebugLottieDeviceTab", () => {
  it("renders the selected animation title and previews", () => {
    render(<DebugLottieDeviceTab />);

    expect(screen.getByText("Showing 'deviceAnim'")).toBeVisible();
    expect(screen.getAllByTestId("mock-animation")).toHaveLength(2);
  });

  it("updates animations when the device model changes", () => {
    render(<DebugLottieDeviceTab />);

    fireEvent.press(screen.getByText(DeviceModelId.nanoX));

    expect(screen.getByText("Showing 'deviceAnim'")).toBeVisible();
    expect(screen.getByText(DeviceModelId.nanoX)).toBeVisible();
  });

  it("opens the animation key drawer and selects another animation", () => {
    render(<DebugLottieDeviceTab />);

    fireEvent.press(screen.getByText("Animation key"));
    fireEvent.press(screen.getByText("onboardingAnim"));

    expect(screen.getByText("Showing 'onboardingAnim'")).toBeVisible();
  });
});
