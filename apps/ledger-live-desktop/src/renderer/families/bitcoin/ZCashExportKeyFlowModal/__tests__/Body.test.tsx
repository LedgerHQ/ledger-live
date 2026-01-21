import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/devices";
import Body from "../Body";
import { StepId } from "../types";

describe("ZCash Export UFVK - Body", () => {
  const isUfvkExported = false;
  const ufvkExportError = null;
  const account = createFixtureAccount();

  const mockDevice: Device = {
    deviceId: "test-device-id",
    modelId: DeviceModelId.nanoS,
    wired: false,
  };

  it("should show intro step", () => {
    const stepId: StepId = "intro";

    render(
      <Body
        stepId={stepId}
        isUfvkExported={isUfvkExported}
        ufvkExportError={ufvkExportError}
        onChangeStepId={jest.fn()}
        onUfvkExported={jest.fn()}
        onClose={jest.fn()}
        params={{ account }}
      />,
    );

    expect(screen.getByText(/enable shielded/i)).toBeVisible();
    expect(
      screen.getByText(
        /to begin, you must export your unified full viewing key \(ufvk\)\. this action requires your confirmation on the ledger device\./i,
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: /cancel/i,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: /continue/i,
      }),
    ).toBeVisible();
  });

  it("should show device step", async () => {
    const stepId: StepId = "device";

    render(
      <Body
        stepId={stepId}
        isUfvkExported={isUfvkExported}
        ufvkExportError={ufvkExportError}
        onChangeStepId={jest.fn()}
        onUfvkExported={jest.fn()}
        onClose={jest.fn()}
        params={{ account }}
      />,
    );

    const cancelButton = screen.queryByRole("button", {
      name: /cancel/i,
    });
    const continueButton = screen.queryByRole("button", {
      name: /continue/i,
    });
    expect(cancelButton).toBeNull();
    expect(continueButton).toBeNull();

    await waitFor(() => {
      expect(screen.queryByText(/connect and unlock your device/i)).toBeVisible();
    });
  });

  it("should show UFVK step", async () => {
    const stepId: StepId = "export";

    // Mock the bridge to prevent errors from the useEffect
    const mockReceive = jest.fn(() => ({
      subscribe: jest.fn(),
    }));
    jest.spyOn(require("@ledgerhq/live-common/bridge/index"), "getAccountBridge").mockReturnValue({
      receive: mockReceive,
    });

    render(
      <Body
        stepId={stepId}
        isUfvkExported={isUfvkExported}
        ufvkExportError={ufvkExportError}
        onChangeStepId={jest.fn()}
        onUfvkExported={jest.fn()}
        onClose={jest.fn()}
        params={{ account }}
      />,
      {
        initialState: {
          devices: { currentDevice: mockDevice, devices: [mockDevice] },
        },
      },
    );

    const cancelButton = screen.queryByRole("button", {
      name: /cancel/i,
    });
    const continueButton = screen.queryByRole("button", {
      name: /continue/i,
    });
    expect(cancelButton).toBeNull();
    expect(continueButton).toBeNull();

    await waitFor(async () => {
      expect(
        await screen.queryByText(/confirm you want to export the UFVK on the device/i),
      ).toBeVisible();
    });
  });

  it("should show confirmation step", () => {
    const stepId: StepId = "confirmation";

    render(
      <Body
        stepId={stepId}
        isUfvkExported={isUfvkExported}
        ufvkExportError={ufvkExportError}
        onChangeStepId={jest.fn()}
        onUfvkExported={jest.fn()}
        onClose={jest.fn()}
        params={{ account }}
      />,
    );

    expect(
      screen.queryByRole("button", {
        name: /close/i,
      }),
    ).toBeVisible();

    expect(screen.getByText(/ufvk exported successfully/i)).toBeVisible();
    expect(
      screen.getByText(
        /you can now start to synchronize your account and include your shielded transaction into your history./i,
      ),
    ).toBeVisible();
  });
});
