import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { DeviceOutOfStorageSpaceView } from "./DeviceOutOfStorageSpaceView";

describe("DeviceOutOfStorageSpaceView", () => {
  const renderView = () => {
    const onOpenMyLedger = jest.fn();
    const { user } = render(
      <DeviceOutOfStorageSpaceView
        appNamesText="Ethereum, Bitcoin"
        onOpenMyLedger={onOpenMyLedger}
      />,
    );
    return { user, onOpenMyLedger };
  };

  it("GIVEN the out of storage view WHEN rendering THEN it shows the memory warning and the apps to manage", () => {
    // GIVEN
    renderView();

    // THEN
    expect(screen.getByText("Not enough device memory")).toBeVisible();
    expect(screen.getByText("Apps to manage: Ethereum, Bitcoin")).toBeVisible();
  });

  it("GIVEN the out of storage view WHEN clicking Go to My Ledger THEN it opens the manager", async () => {
    // GIVEN
    const { user, onOpenMyLedger } = renderView();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Go to My Ledger" }));

    // THEN
    expect(onOpenMyLedger).toHaveBeenCalledTimes(1);
  });
});
