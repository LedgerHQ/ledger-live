import React from "react";
import { act, fireEvent, render, screen, userEvent, waitFor } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { of } from "rxjs";
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
        // mapResult requires: opened=true, device exists, displayUpgradeWarning=false
        return {
          device: mockDevice,
          isLoading: false,
          error: null,
          isLocked: false,
          opened: true,
          displayUpgradeWarning: false,
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

describe("ZCash Export UFVK Flow - Integration test", () => {
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

  it("should navigate through the flow", async () => {
    // Mock the bridge to prevent errors from the useEffect in StepExport
    // The receive function returns an Observable that emits when UFVK is received
    // We mock it to emit immediately so firstValueFrom resolves and triggers transitionTo("confirmation")
    const mockReceive = jest.fn(() =>
      of({
        address: account.freshAddress,
        path: account.freshAddressPath,
        publicKey: "mock-public-key",
      }),
    );
    jest.spyOn(require("@ledgerhq/live-common/bridge/index"), "getAccountBridge").mockReturnValue({
      receive: mockReceive,
    });

    let stepId: StepId = "birthday";
    let currentBirthday = birthday;

    const handleBirthdayChange = jest.fn((newBirthday: string) => {
      currentBirthday = newBirthday;
    });
    let currentSyncFromZero = syncFromZero;
    const handleSyncFromZero = jest.fn(() => {
      currentSyncFromZero = !currentSyncFromZero;
    });
    const handleStepIdChanged = jest.fn((newStepId: StepId) => {
      stepId = newStepId;
    });

    const { rerender } = render(
      <Body
        stepId={stepId}
        ufvk={ufvk}
        ufvkExportError={ufvkExportError}
        onStepIdChanged={handleStepIdChanged}
        onUfvkChanged={jest.fn()}
        onRetry={jest.fn()}
        onClose={jest.fn()}
        birthday={currentBirthday}
        invalidBirthday={invalidBirthday}
        syncFromZero={syncFromZero}
        handleBirthdayChange={handleBirthdayChange}
        handleSyncFromZero={handleSyncFromZero}
        params={{ account }}
      />,
      {
        initialState: {
          devices: { currentDevice: mockDevice, devices: [mockDevice] },
        },
      },
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

    const birthdayHeightInput = screen.getByTestId("birthday-height");
    act(() => birthdayHeightInput.focus());
    expect(birthdayHeightInput).toHaveFocus();

    fireEvent.change(birthdayHeightInput, { target: { value: "2025-01-01" } });

    await waitFor(() => {
      expect(handleBirthdayChange).toHaveBeenCalledWith("2025-01-01");
    });

    // Rerender with updated birthday to simulate parent state update
    rerender(
      <Body
        stepId={stepId}
        ufvk={ufvk}
        ufvkExportError={ufvkExportError}
        onStepIdChanged={handleStepIdChanged}
        onUfvkChanged={jest.fn()}
        onRetry={jest.fn()}
        onClose={jest.fn()}
        birthday={currentBirthday}
        invalidBirthday={invalidBirthday}
        syncFromZero={syncFromZero}
        handleBirthdayChange={handleBirthdayChange}
        handleSyncFromZero={handleSyncFromZero}
        params={{ account }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("birthday-height")).toHaveValue("2025-01-01");
    });

    userEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(handleStepIdChanged).toHaveBeenCalledWith("ufvk");
    });

    // Rerender with updated stepId to simulate parent state update
    rerender(
      <Body
        stepId={stepId}
        ufvk={ufvk}
        ufvkExportError={ufvkExportError}
        onStepIdChanged={handleStepIdChanged}
        onUfvkChanged={jest.fn()}
        onRetry={jest.fn()}
        onClose={jest.fn()}
        birthday={currentBirthday}
        invalidBirthday={invalidBirthday}
        syncFromZero={syncFromZero}
        handleBirthdayChange={handleBirthdayChange}
        handleSyncFromZero={handleSyncFromZero}
        params={{ account }}
      />,
    );

    await waitFor(() => {
      expect(
        screen.queryByText(
          /to begin, you must export your unified full viewing key \(ufvk\). this action requires your confirmation on your ledger device./i,
        ),
      ).toBeVisible();
    });

    await userEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(handleStepIdChanged).toHaveBeenCalledWith("device");
    });

    // Rerender with updated stepId to simulate parent state update
    rerender(
      <Body
        stepId={stepId}
        ufvk={ufvk}
        ufvkExportError={ufvkExportError}
        onStepIdChanged={handleStepIdChanged}
        onUfvkChanged={jest.fn()}
        onRetry={jest.fn()}
        onClose={jest.fn()}
        birthday={currentBirthday}
        invalidBirthday={invalidBirthday}
        syncFromZero={syncFromZero}
        handleBirthdayChange={handleBirthdayChange}
        handleSyncFromZero={handleSyncFromZero}
        params={{ account }}
      />,
    );

    await waitFor(
      () => {
        expect(screen.getByText(/confirm ufvk export on your Ledger device/i)).toBeVisible();
      },
      { timeout: 5000 },
    );

    await waitFor(() => {
      expect(handleStepIdChanged).toHaveBeenCalledWith("confirmation");
    });

    // Rerender with updated stepId to simulate parent state update
    rerender(
      <Body
        stepId={stepId}
        ufvk={ufvk}
        ufvkExportError={ufvkExportError}
        onStepIdChanged={handleStepIdChanged}
        onUfvkChanged={jest.fn()}
        onRetry={jest.fn()}
        onClose={jest.fn()}
        birthday={currentBirthday}
        invalidBirthday={invalidBirthday}
        syncFromZero={syncFromZero}
        handleBirthdayChange={handleBirthdayChange}
        handleSyncFromZero={handleSyncFromZero}
        params={{ account }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/ufvk successfully imported/i)).toBeVisible();
    });
    await waitFor(() => {
      expect(
        screen.getByText(
          /your unified full viewing key remains stored locally on your computer and is never transmitted or exposed to external systems./i,
        ),
      ).toBeVisible();
    });
    await waitFor(() => {
      expect(
        screen.getByText(
          /accounts with an older birth height may require a longer synchronisation \(up to 2 hours\). please keep the app open until syncing finishes./i,
        ),
      ).toBeVisible();
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /close/i })).toBeVisible();
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /start sync/i })).toBeVisible();
    });
  });
});
