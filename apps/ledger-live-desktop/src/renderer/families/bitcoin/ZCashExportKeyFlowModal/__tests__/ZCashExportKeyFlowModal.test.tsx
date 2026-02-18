import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/devices";
import Body from "../Body";
import { StepId } from "../types";

// Mock useConnectAppAction to prevent actual device connection attempts
jest.mock("~/renderer/hooks/useConnectAppAction", () => {
  const mockDevice: Device = {
    deviceId: "test-device-id",
    modelId: DeviceModelId.nanoS,
    wired: false,
  };

  return {
    __esModule: true,
    default: () => ({
      useHook: () => {
        // Return a state that indicates device is connected and ready
        // Include appAndVersion to indicate the app is open
        return {
          device: mockDevice,
          isLoading: false,
          error: null,
          isLocked: false,
          appAndVersion: {
            name: "Bitcoin",
            version: "2.1.0",
          },
        };
      },
      mapResult: (hookState: { device?: Device }) => {
        // Return a payload when device is connected
        if (hookState.device) {
          return { device: hookState.device };
        }
        return null;
      },
    }),
  };
});

describe("ZCash Export UFVK Flow", () => {
  const ufvkExportError = null;
  const account = createFixtureAccount();
  const ufvk = "";
  const birthday = new Date().toISOString().split("T")[0];
  const invalidBirthday = false;
  const syncFromZero = false;

  const mockDevice: Device = {
    deviceId: "test-device-id",
    modelId: DeviceModelId.nanoS,
    wired: false,
  };

  it("should show birthday step", async () => {
    const stepId: StepId = "birthday";

    render(
      <Body
        stepId={stepId}
        ufvk={ufvk}
        ufvkExportError={ufvkExportError}
        onStepIdChanged={jest.fn()}
        onUfvkChanged={jest.fn()}
        onRetry={jest.fn()}
        onClose={jest.fn()}
        birthday={birthday}
        invalidBirthday={invalidBirthday}
        syncFromZero={syncFromZero}
        handleBirthdayChange={jest.fn()}
        handleSyncFromZero={jest.fn()}
        params={{ account }}
      />,
    );

    expect(screen.getByText(/enable zcash private balance/i)).toBeVisible();
    await waitFor(() => {
      expect(
        screen.queryByText(
          /the birth height is the point on the blockchain where your wallet begins scanning for your funds./i,
        ),
      ).toBeVisible();
    });
    expect(screen.getByTestId("birthday-height")).toHaveValue(
      new Date().toISOString().split("T")[0],
    );
    expect(
      screen.getByText(
        /this account received shielded zec in the past, but I can't retrieve the birth height. scan from block 0 \(this may take a long time\)./i,
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: /continue/i,
      }),
    ).toBeVisible();
  });

  it("should show ufvk step", async () => {
    const stepId: StepId = "ufvk";

    render(
      <Body
        stepId={stepId}
        ufvk={ufvk}
        ufvkExportError={ufvkExportError}
        onStepIdChanged={jest.fn()}
        onUfvkChanged={jest.fn()}
        onRetry={jest.fn()}
        onClose={jest.fn()}
        birthday={birthday}
        invalidBirthday={invalidBirthday}
        syncFromZero={syncFromZero}
        handleBirthdayChange={jest.fn()}
        handleSyncFromZero={jest.fn()}
        params={{ account }}
      />,
    );

    expect(screen.getByText(/enable zcash private balance/i)).toBeVisible();
    await waitFor(() => {
      expect(
        screen.queryByText(
          /to begin, you must export your unified full viewing key \(ufvk\). this action requires your confirmation on your ledger device./i,
        ),
      ).toBeVisible();
    });
    expect(screen.getByText(/back/i)).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: /continue/i,
      }),
    ).toBeVisible();
  });

  it("should show device step", async () => {
    const stepId: StepId = "device";

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
        ufvk={ufvk}
        ufvkExportError={ufvkExportError}
        onStepIdChanged={jest.fn()}
        onUfvkChanged={jest.fn()}
        onRetry={jest.fn()}
        onClose={jest.fn()}
        birthday={birthday}
        invalidBirthday={invalidBirthday}
        syncFromZero={syncFromZero}
        handleBirthdayChange={jest.fn()}
        handleSyncFromZero={jest.fn()}
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
      expect(await screen.queryByText(/confirm ufvk export on your Ledger device/i)).toBeVisible();
    });
  });

  it("should show confirmation step", async () => {
    const stepId: StepId = "confirmation";

    render(
      <Body
        stepId={stepId}
        ufvk={ufvk}
        ufvkExportError={ufvkExportError}
        onStepIdChanged={jest.fn()}
        onUfvkChanged={jest.fn()}
        onRetry={jest.fn()}
        onClose={jest.fn()}
        birthday={birthday}
        invalidBirthday={invalidBirthday}
        syncFromZero={syncFromZero}
        handleBirthdayChange={jest.fn()}
        handleSyncFromZero={jest.fn()}
        params={{ account }}
      />,
    );

    expect(screen.getByText(/enable zcash private balance/i)).toBeVisible();
    await waitFor(() => {
      expect(screen.queryByText(/ufvk successfully imported/i)).toBeVisible();
    });
    expect(
      screen.getByText(
        /your unified full viewing key remains stored locally on your computer and is never transmitted or exposed to external systems./i,
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        /accounts with an older birth height may require a longer synchronisation \(up to 2 hours\). please keep the app open until syncing finishes./i,
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: /close/i,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: /start sync/i,
      }),
    ).toBeVisible();
  });
});
