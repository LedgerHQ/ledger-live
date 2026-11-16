import React from "react";
import { render, screen } from "../../../__tests__/render";
import { ContinueOnDeviceContent } from "./ContinueOnDeviceContent";

describe("ContinueOnDeviceContent", () => {
  it("asks to continue on the device", () => {
    render(
      <ContinueOnDeviceContent
        actionModelId="stax"
        deviceName="Ledger Stax"
        productName="Ledger Stax"
      />,
    );

    expect(screen.getByTestId("os-update-continue-on-device")).toBeVisible();
    expect(screen.getByText("Continue on your Ledger Stax")).toBeVisible();
  });

  it("offers no action", () => {
    render(
      <ContinueOnDeviceContent
        actionModelId="stax"
        deviceName="Ledger Stax"
        productName="Ledger Stax"
      />,
    );

    expect(screen.queryByText("Cancel")).toBeNull();
  });
});
