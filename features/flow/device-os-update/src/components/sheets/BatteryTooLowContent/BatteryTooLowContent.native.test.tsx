import React from "react";
import { render, screen } from "../../../__tests__/render";
import { BatteryLowIcon } from "./BatteryLowIcon";
import { BatteryTooLowContent } from "./BatteryTooLowContent";

const renderContent = (onCancel = jest.fn()) =>
  render(
    <BatteryTooLowContent
      DeviceIcon={() => null}
      productName="Ledger Nano Gen5"
      percentage={17}
      onCancel={onCancel}
    />,
  );

describe("BatteryTooLowContent", () => {
  it("asks to plug the device in until it is charged enough", () => {
    renderContent();

    expect(screen.getByText("Plug in your Ledger Nano Gen5 to continue")).toBeVisible();
    expect(
      screen.getByText(
        "Installation will start when your Ledger Nano Gen5 is plugged in or charged at least 20%.",
      ),
    ).toBeVisible();
  });

  it("shows a low battery icon", () => {
    renderContent();

    expect(screen.UNSAFE_getByProps({ icon: BatteryLowIcon })).toBeTruthy();
  });

  it("shows the battery level of the device", () => {
    renderContent();

    expect(screen.getByTestId("os-update-battery-level")).toHaveTextContent("Battery level: 17%");
  });

  it("cancels the OS update on press", async () => {
    const onCancel = jest.fn();
    const { user } = renderContent(onCancel);

    await user.press(screen.getByText("Cancel OS update"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
