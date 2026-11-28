import type { RestoreStatus } from "@domain/entity-device-os-update";

/** The full-screen state of a step, rendered by each platform's `OsUpdateStep`. */
export type OsUpdateScreen =
  | Readonly<{ type: "preparing" }>
  | Readonly<{
      type: "progress";
      progress: number;
      isRestoring: boolean;
      update?: Readonly<{ index: number; count: number }>;
      /** Set while the bar fills up to 100% before the success screen. */
      finishing?: Readonly<{ from: number; onFinished: () => void }>;
    }>
  | Readonly<
      { type: "applied"; restoreStatus: RestoreStatus | undefined; onClose: () => void } & (
        | { isRestoreOnly: false; osVersion: string }
        | { isRestoreOnly: true }
      )
    >;
