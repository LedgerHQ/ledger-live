/** The bottom sheet state shown over the screen of a step. */
export type OsUpdateSheet =
  | Readonly<{ type: "deviceLocked" }>
  | Readonly<{ type: "deviceDisconnected" }>
  | Readonly<{ type: "continueOnDevice" }>
  | Readonly<{ type: "connectionTimedOut"; onRestart: () => void; onCancel: () => void }>
  | Readonly<{ type: "batteryTooLow"; percentage: number; onCancel: () => void }>
  | Readonly<{ type: "unexpectedError"; onCancel: () => void }>
  | Readonly<{ type: "secureConnectionRefused"; onRetry: () => void; onCancel: () => void }>
  | Readonly<{ type: "installFirmwareRefused"; onRetry: () => void; onCancel: () => void }>
  | Readonly<{
      type: "backupSelection";
      backupCreatedAt: Date;
      onUseExisting: () => void;
      onCreateNew: () => void;
    }>;
