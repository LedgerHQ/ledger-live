import React from "react";
import { RestoreStatus } from "@domain/entity-device-os-update";
import { render, screen } from "../../__tests__/render";
import { UpdatesAppliedScreen } from "./UpdatesAppliedScreen";

const PARTIAL_BANNER = /You didn't reinstall your apps and lock screen/;
const OUT_OF_MEMORY_BANNER = /Not enough storage available while reinstalling/;

describe("UpdatesAppliedScreen", () => {
  it("shows the OS version the device is now up to date with", () => {
    render(
      <UpdatesAppliedScreen
        productName="Ledger Stax"
        isRestoreOnly={false}
        osVersion="2.0.0"
        restoreStatus={RestoreStatus.full}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("Your Ledger Stax is now up to date")).toBeVisible();
    expect(screen.getByText("OS version: 2.0.0")).toBeVisible();
  });

  it("shows no OS version for a standalone restore", () => {
    render(
      <UpdatesAppliedScreen
        productName="Ledger Stax"
        isRestoreOnly
        restoreStatus={RestoreStatus.full}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("Apps and settings reinstalled on your Ledger Stax")).toBeVisible();
    expect(screen.queryByText(/OS version/)).toBeNull();
  });

  it.each([RestoreStatus.full, RestoreStatus.partial, RestoreStatus.outOfMemory])(
    "lists what a standalone restore reinstalls after a %s restore",
    restoreStatus => {
      render(
        <UpdatesAppliedScreen
          productName="Ledger Stax"
          isRestoreOnly
          restoreStatus={restoreStatus}
          onClose={jest.fn()}
        />,
      );

      expect(screen.getByText("Lock screen, Language and apps.")).toBeVisible();
    },
  );

  describe.each([
    ["an OS update", { isRestoreOnly: false, osVersion: "2.0.0" } as const],
    ["a standalone restore", { isRestoreOnly: true } as const],
  ])("after %s", (_flow, flowProps) => {
    it.each([
      ["a full", RestoreStatus.full],
      ["no", undefined],
    ])("shows no banner when %s restore ran", (_restore, restoreStatus) => {
      render(
        <UpdatesAppliedScreen
          productName="Ledger Stax"
          {...flowProps}
          restoreStatus={restoreStatus}
          onClose={jest.fn()}
        />,
      );

      expect(screen.queryByTestId("os-update-restore-banner")).toBeNull();
    });

    it.each([
      [RestoreStatus.partial, PARTIAL_BANNER],
      [RestoreStatus.outOfMemory, OUT_OF_MEMORY_BANNER],
    ])("explains what was not reinstalled for a %s restore", (restoreStatus, banner) => {
      render(
        <UpdatesAppliedScreen
          productName="Ledger Stax"
          {...flowProps}
          restoreStatus={restoreStatus}
          onClose={jest.fn()}
        />,
      );

      expect(screen.getByTestId("os-update-restore-banner")).toHaveTextContent(banner);
    });
  });

  it("closes on finish", async () => {
    const onClose = jest.fn();
    const { user } = render(
      <UpdatesAppliedScreen
        productName="Ledger Stax"
        isRestoreOnly={false}
        osVersion="2.0.0"
        restoreStatus={RestoreStatus.full}
        onClose={onClose}
      />,
    );

    await user.press(screen.getByText("Finish"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
