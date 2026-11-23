import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Result } from "@ledgerhq/live-common/hw/actions/manager";
import type { DeviceConnectionResult } from "@ledgerhq/live-dmk-shared";
import type { useManagerDeviceAction } from "~/hooks/deviceActions";

export type MyWalletDeviceListProps = {
  /** Called when the Add mode starts and stops. My Wallet hides its other sections. */
  onAddModeChange?: (isAdding: boolean) => void;
};

export type MyWalletDeviceListViewProps = {
  isAdding: boolean;
  topInset: number;
  isPaused: boolean;
  onConnected: (result: DeviceConnectionResult) => void;
  onAddModeChange: (isAdding: boolean) => void;
  onDeviceNotFound: () => void;
  /** Set when onboarding owns the Add entry point: Add opens Get Started instead of the Add mode. */
  onAddDevice?: (hasDevices: boolean) => void;
  /** Opens the comparison page of the Ledger shop in the browser. */
  onExploreDevices: () => void;
  /** The device under the lock check, before the device action. */
  deviceToCheck: Device | null;
  onDeviceUnlocked: () => void;
  onCloseLockedCheck: () => void;
  /** The device of the My Ledger device action. */
  device: Device | undefined;
  action: ReturnType<typeof useManagerDeviceAction>;
  onResult: (result: Result) => void;
  onCloseModal: () => void;
  onModalHide: () => void;
  /** Receives the modal's reset of its last result, so that the next device opens it again. */
  registerDeviceSelection: (clearResult: () => void) => void;
};
