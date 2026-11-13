import type { DeviceConnectionResult, Job } from "@features/platform-device-intent";
import type { DeviceId } from "@domain/entity-client-identity";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { Observable, type Subscription } from "rxjs";
import type { ListAppsResult } from "../../apps/types";
import { DeviceNotOnboarded } from "../../errors";
import type { Device } from "../../hw/actions/types";
import connectManagerFactory from "../../hw/connectManager";
import { isCounterfeitError } from "../../hw/isCounterfeitError";
import type {
  OpenMyLedgerIntentInput,
  OpenMyLedgerIntentJobState,
  OpenMyLedgerIntentResult,
} from "./types";

function buildLegacyDevice(connectionResult: DeviceConnectionResult): Device {
  return {
    deviceId: connectionResult.compatDeviceId,
    deviceName: connectionResult.compatDeviceName,
    modelId: dmkToLedgerDeviceIdMap[connectionResult.connectedDevice.modelId],
    wired: connectionResult.compatDeviceWired,
  };
}

/** Runs the legacy My Ledger connection task (`connectManager`) on the executor's session. */
export const openMyLedgerIntentJob: Job<
  OpenMyLedgerIntentJobState,
  OpenMyLedgerIntentInput,
  OpenMyLedgerIntentResult
> = ({ deviceConnectionResult, input, onResult }) => {
  const device = buildLegacyDevice(deviceConnectionResult);

  return new Observable<OpenMyLedgerIntentJobState>(subscriber => {
    let taskSubscription: Subscription | undefined;
    let runRequestId = 0;

    const run = () => {
      const currentRunRequestId = ++runRequestId;
      const isStale = () => subscriber.closed || currentRunRequestId !== runRequestId;
      taskSubscription?.unsubscribe();
      subscriber.next({ type: "loading", device });

      let deviceId: DeviceId | undefined;
      let hasQuittedApp = false;

      const reportResult = (result: ListAppsResult) => {
        const { deviceInfo } = result;
        const resolvingOsUpdates =
          input.resolveOsUpdates?.({ deviceConnectionResult, device, deviceInfo }) ??
          Promise.resolve();
        resolvingOsUpdates
          .catch(() => undefined)
          .then(() => {
            if (isStale()) return;
            onResult({ device, deviceInfo, result, deviceId });
            subscriber.next({ type: "loaded", device });
            subscriber.complete();
          });
      };

      taskSubscription = connectManagerFactory()({
        deviceId: device.deviceId,
        deviceName: device.deviceName ?? null,
        request: null,
      }).subscribe({
        next: event => {
          if (isStale()) return;
          switch (event.type) {
            case "unresponsiveDevice":
              subscriber.next({ type: "unresponsive", device });
              return;
            case "lockedDevice":
              subscriber.next({ type: "device-locked", device, retry: run });
              return;
            case "appDetected":
              subscriber.next({ type: "quit-app", device, retry: run });
              return;
            case "appQuitted":
              hasQuittedApp = true;
              return;
            case "bootloader":
              subscriber.next({ type: "bootloader", device, deviceInfo: event.deviceInfo });
              return;
            case "osu":
              subscriber.error(new Error("The device is in OSU mode"));
              return;
            case "listingApps":
            case "device-permission-granted":
              subscriber.next({ type: "loading", device });
              return;
            case "device-permission-requested":
            case "allow-manager-requested":
              subscriber.next({ type: "allow-secure-connection", device });
              return;
            case "device-id":
              deviceId = event.deviceId;
              return;
            case "result":
              reportResult(event.result);
              return;
          }
        },
        error: error => {
          if (isStale()) return;
          if (error instanceof DeviceNotOnboarded) {
            subscriber.next({ type: "not-onboarded", device });
            return;
          }
          if (isCounterfeitError(error)) {
            subscriber.next({ type: "counterfeit", device });
            return;
          }
          subscriber.error(error);
        },
        complete: () => {
          if (isStale()) return;
          if (hasQuittedApp) run();
        },
      });
    };

    run();

    return () => {
      runRequestId += 1;
      taskSubscription?.unsubscribe();
    };
  });
};
