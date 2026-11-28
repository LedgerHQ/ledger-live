import React, { type ReactNode } from "react";
import type { ConnectedDevice, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { OsUpdate } from "@domain/entity-device-os-update";
import type { DeviceBackupStorage } from "../../types/DeviceBackupStorage";
import type { CloseConfirmationProps, OsUpdateStepProps } from "../../types/OsUpdateStep";
import { OsUpdatesOrchestratorView } from "./OsUpdatesOrchestratorView";
import { useOsUpdatesOrchestratorViewModel } from "./useOsUpdatesOrchestratorViewModel";

export type OsUpdatesOrchestratorProps = Readonly<{
  dmk: DeviceManagementKit;
  /** The DMK session of the device to update. */
  connectedDevice: ConnectedDevice;
  /** The updates to apply, in order. Empty to only repair the device or restore its backup. */
  osUpdates: OsUpdate[];
  /** Where the backup of the apps and settings is kept while the device is updated. */
  backupStorage: DeviceBackupStorage;
  /**
   * Renders the current step. Return the same component for every step: a different one per step
   * would remount it, and unmount the bottom sheet a previous step may still show.
   */
  renderStep: (props: OsUpdateStepProps) => ReactNode;
  /** Called when the user closes the run, or it is stopped. Completion goes to `onCompleted`. */
  onStop: () => void;
  /** Without it, closing the run stops it at once instead of asking for a confirmation. */
  renderCloseConfirmation?: (props: CloseConfirmationProps) => ReactNode;
  /** Called once the updates are applied, before the user closes the run. */
  onCompleted?: () => void;
  /** How long to wait for the user to unlock the device, in milliseconds. */
  unlockTimeout?: number;
}>;

/** Runs the OS update orchestrator and renders its steps with the components of the caller. */
export function OsUpdatesOrchestrator(props: OsUpdatesOrchestratorProps) {
  return <OsUpdatesOrchestratorView {...useOsUpdatesOrchestratorViewModel(props)} />;
}
