import React from "react";
import type { OsUpdateDeviceView } from "../../hooks/useOsUpdateDevice";
import { BackupSelectionContent } from "../sheets/BackupSelectionContent/BackupSelectionContent";
import { BatteryTooLowContent } from "../sheets/BatteryTooLowContent/BatteryTooLowContent";
import { ConnectionTimedOutContent } from "../sheets/ConnectionTimedOutContent/ConnectionTimedOutContent";
import { ContinueOnDeviceContent } from "../sheets/ContinueOnDeviceContent/ContinueOnDeviceContent";
import { DeviceDisconnectedContent } from "../sheets/DeviceDisconnectedContent/DeviceDisconnectedContent";
import { DeviceLockedContent } from "../sheets/DeviceLockedContent/DeviceLockedContent";
import { InstallFirmwareRefusedContent } from "../sheets/InstallFirmwareRefusedContent/InstallFirmwareRefusedContent";
import { SecureConnectionRefusedContent } from "../sheets/SecureConnectionRefusedContent/SecureConnectionRefusedContent";
import { UnexpectedErrorContent } from "../sheets/UnexpectedErrorContent/UnexpectedErrorContent";
import type { OsUpdateSheet } from "../../types/OsUpdateSheet";

type Props = Readonly<{ sheet: OsUpdateSheet; device: OsUpdateDeviceView }>;

/** The sheets that only wait on the device keep their header, so the user can close them. */
export function isSheetHeaderHidden(sheet: OsUpdateSheet): boolean {
  switch (sheet.type) {
    case "deviceLocked":
    case "deviceDisconnected":
    case "continueOnDevice":
      return false;
    case "connectionTimedOut":
    case "batteryTooLow":
    case "unexpectedError":
    case "secureConnectionRefused":
    case "installFirmwareRefused":
    case "backupSelection":
      return true;
    default: {
      const unhandled: never = sheet;
      return unhandled;
    }
  }
}

export function OsUpdateSheetView({ sheet, device }: Props) {
  const { actionModelId, deviceName, productName, Icon } = device;
  switch (sheet.type) {
    case "deviceLocked":
      return (
        <DeviceLockedContent
          actionModelId={actionModelId}
          deviceName={deviceName}
          productName={productName}
        />
      );
    case "deviceDisconnected":
      return (
        <DeviceDisconnectedContent
          actionModelId={actionModelId}
          deviceName={deviceName}
          productName={productName}
        />
      );
    case "continueOnDevice":
      return (
        <ContinueOnDeviceContent
          actionModelId={actionModelId}
          deviceName={deviceName}
          productName={productName}
        />
      );
    case "connectionTimedOut":
      return <ConnectionTimedOutContent onRestart={sheet.onRestart} onCancel={sheet.onCancel} />;
    case "batteryTooLow":
      return (
        <BatteryTooLowContent
          DeviceIcon={Icon}
          productName={productName}
          percentage={sheet.percentage}
          onCancel={sheet.onCancel}
        />
      );
    case "unexpectedError":
      return <UnexpectedErrorContent onCancel={sheet.onCancel} />;
    case "secureConnectionRefused":
      return (
        <SecureConnectionRefusedContent
          productName={productName}
          onRetry={sheet.onRetry}
          onCancel={sheet.onCancel}
        />
      );
    case "installFirmwareRefused":
      return (
        <InstallFirmwareRefusedContent
          productName={productName}
          onRetry={sheet.onRetry}
          onCancel={sheet.onCancel}
        />
      );
    case "backupSelection":
      return (
        <BackupSelectionContent
          productName={productName}
          backupCreatedAt={sheet.backupCreatedAt}
          onUseExisting={sheet.onUseExisting}
          onCreateNew={sheet.onCreateNew}
        />
      );
    default: {
      const unhandled: never = sheet;
      return unhandled;
    }
  }
}
