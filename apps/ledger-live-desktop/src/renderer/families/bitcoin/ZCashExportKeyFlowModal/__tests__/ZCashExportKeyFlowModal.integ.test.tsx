import React from "react";
import { act, fireEvent, render, screen, userEvent, waitFor } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import ExportKeyModal from "../index";
import { StepId } from "../types";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge");
const mockedUseAccountBridge = jest.mocked(useAccountBridge);

const mockDispatch = jest.fn();
const mockSyncStateUpdater = jest.fn();

jest.mock("LLD/hooks/redux", () => {
  const actual = jest.requireActual("LLD/hooks/redux");
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

jest.mock("../sync", () => ({
  syncStateUpdater: (...args: unknown[]) => mockSyncStateUpdater(...args),
}));

jest.mock("~/renderer/components/Modal", () => {
  const actual = jest.requireActual("~/renderer/components/Modal");
  const MockModal = ({
    render: renderContent,
  }: {
    render?: (args: { onClose: () => void; data: unknown }) => React.ReactNode;
  }) => (
    <>
      {renderContent?.({
        onClose: jest.fn(),
        data: {},
      })}
    </>
  );

  return {
    ...actual,
    __esModule: true,
    default: MockModal,
  };
});

jest.mock("../Body", () => {
  return function MockBody({
    onUfvkChanged,
    handleBirthdayChange,
    handleEnableShieldedBalance,
  }: {
    onUfvkChanged: (ufvk: string) => void;
    handleBirthdayChange: (birthday: string) => void;
    handleEnableShieldedBalance: (nextSyncState: "ready" | "running") => void;
  }) {
    return (
      <div>
        <button type="button" onClick={() => onUfvkChanged("test-ufvk")}>
          set ufvk
        </button>
        <button type="button" onClick={() => handleBirthdayChange("2025-01-01")}>
          set birthday
        </button>
        <button type="button" onClick={() => handleEnableShieldedBalance("ready")}>
          Close
        </button>
        <button type="button" onClick={() => handleEnableShieldedBalance("running")}>
          Start sync
        </button>
      </div>
    );
  };
});

const RealBody = jest.requireActual("../Body").default;

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
    // The getFullViewingKey function resolves immediately with a UFVK value
    // so the flow transitions directly to confirmation.
    const mockGetFullViewingKey = jest.fn(async () => ({
      viewKey: "uview1mocked",
        path: account.freshAddressPath,
      }));
    mockedUseAccountBridge.mockReturnValue({
      getFullViewingKey: mockGetFullViewingKey,
    } as unknown as ReturnType<typeof useAccountBridge>);

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
      <RealBody
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
        handleEnableShieldedBalance={jest.fn()}
        params={{ account }}
      />,
      {
        initialState: {
          settings: AFTER_ONBOARDING_STATE,
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
      <RealBody
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
        handleEnableShieldedBalance={jest.fn()}
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
      <RealBody
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
        handleEnableShieldedBalance={jest.fn()}
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
      <RealBody
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
        handleEnableShieldedBalance={jest.fn()}
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
      <RealBody
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
        handleEnableShieldedBalance={jest.fn()}
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

describe("ZCash Export UFVK Flow - Persistence integration", () => {
  const account = createFixtureAccount();
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("persists ufvk and birthday when clicking Close", async () => {
    mockSyncStateUpdater.mockReturnValue({ type: "TEST_SYNC_STATE_ACTION" });
    render(<ExportKeyModal account={account} />);

    await userEvent.click(screen.getByRole("button", { name: /set ufvk/i }));
    await userEvent.click(screen.getByRole("button", { name: /set birthday/i }));
    await userEvent.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() => {
      expect(mockSyncStateUpdater).toHaveBeenCalledWith(
        account,
        expect.objectContaining({
          syncState: "ready",
          ufvk: "test-ufvk",
          birthday: "2025-01-01",
        }),
      );
    });
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TEST_SYNC_STATE_ACTION" });
  });

  it("persists ufvk and birthday when clicking Start sync", async () => {
    mockSyncStateUpdater.mockReturnValue({ type: "TEST_SYNC_STATE_ACTION" });
    render(<ExportKeyModal account={account} />);

    await userEvent.click(screen.getByRole("button", { name: /set ufvk/i }));
    await userEvent.click(screen.getByRole("button", { name: /set birthday/i }));
    await userEvent.click(screen.getByRole("button", { name: /start sync/i }));

    await waitFor(() => {
      expect(mockSyncStateUpdater).toHaveBeenCalledWith(
        account,
        expect.objectContaining({
          syncState: "running",
          ufvk: "test-ufvk",
          birthday: "2025-01-01",
        }),
      );
    });
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TEST_SYNC_STATE_ACTION" });
  });
});
