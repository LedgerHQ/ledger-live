import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import { ResolveOsUpdatePathDeviceAction } from "@ledgerhq/dmk-ledger-wallet";
import type { OsUpdate } from "@domain/entity-device-os-update";
import type { ResolveOsUpdatePathInput } from "../../types/ResolveOsUpdatePath";
import { toDomainOsUpdate } from "../../utils/dmk/toDomainOsUpdate";

/**
 * Runs the DMK `ResolveOsUpdatePathDeviceAction` on a session and resolves with its OS updates.
 * Rejects on any device action error: use `ResolveOsUpdatesUseCase` for the guarded resolution.
 */
export function executeResolveOsUpdatePath(input: ResolveOsUpdatePathInput): Promise<OsUpdate[]> {
  const deviceAction = new ResolveOsUpdatePathDeviceAction({
    input: { unlockTimeout: input.unlockTimeout ?? 0 },
  });
  const { observable, cancel } = input.dmk.executeDeviceAction({
    sessionId: input.sessionId,
    deviceAction,
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    let subscription: { unsubscribe: () => void } | undefined;

    const finish = (result: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      subscription?.unsubscribe();
      cancel();
      result();
    };

    subscription = observable.subscribe({
      next: state => {
        switch (state.status) {
          case DeviceActionStatus.NotStarted:
          case DeviceActionStatus.Pending:
            return;
          case DeviceActionStatus.Completed:
            finish(() => {
              resolve(state.output.map(toDomainOsUpdate));
            });
            return;
          case DeviceActionStatus.Error:
            finish(() => {
              reject(state.error);
            });
            return;
          case DeviceActionStatus.Stopped:
            finish(() => {
              reject(new Error("Resolve OS update path stopped"));
            });
            return;
          default: {
            const unhandled: never = state;
            return unhandled;
          }
        }
      },
      error: error => {
        finish(() => {
          reject(error);
        });
      },
      complete: () => {
        finish(() => {
          reject(new Error("Resolve OS update path completed without a terminal snapshot"));
        });
      },
    });
  });
}
