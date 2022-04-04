import { log } from "@ledgerhq/logs";
import { withDevicePolling } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import { from } from "rxjs";
import { timeout } from "rxjs/operators";
import { NativeModules } from "react-native";
import { hasFinalFirmware } from "@ledgerhq/live-common/lib/hw/hasFinalFirmware";
import {
  DeviceInfo,
  FirmwareUpdateContext,
} from "@ledgerhq/live-common/lib/types/manager";
import prepareFirmwareUpdate from "@ledgerhq/live-common/lib/hw/firmwareUpdate-prepare";
import mainFirmwareUpdate from "@ledgerhq/live-common/lib/hw/firmwareUpdate-main";

import { addBackgroundEvent } from "../src/actions/appstate";
import { store } from "../src/context/LedgerStore";
import { BackgroundEvent } from "../src/reducers/appstate";

/**
 * This task is not able to touch UI, but it will allow us to complete tasks
 * even when the device goes to the background. We don't have access to hooks
 * because we are not inside a component but we can read/write the store so we'll
 * use that as the common-ground.
 *
 * Disclaimer: I might have missed some of the cases when
 * backporting the logic from LLD, or the UI might not match in some update paths.
 */
const TAG = "headlessJS";
const BackgroundRunnerService = async ({
  deviceId,
  firmwareSerializedJson,
}: {
  deviceId: string;
  firmwareSerializedJson: string;
}) => {
  const emitEvent = (e: BackgroundEvent) =>
    store.dispatch(addBackgroundEvent(e));
  const latestFirmware = JSON.parse(firmwareSerializedJson) as
    | FirmwareUpdateContext
    | null
    | undefined;

  if (!latestFirmware) {
    log(TAG, "no need to update");
    return 0;
  }

  const onError = (error: any) => {
    emitEvent({ type: "error", error });
    NativeModules.BackgroundRunner.stop();
  };

  const waitForOnlineDevice = (maxWait: number) => {
    return withDevicePolling(deviceId)(
      t => from(getDeviceInfo(t)),
      () => true,
    ).pipe(timeout(maxWait));
  };

  prepareFirmwareUpdate(deviceId, latestFirmware).subscribe({
    next: ({
      progress,
      displayedOnDevice,
    }: {
      progress?: number;
      displayedOnDevice?: boolean;
    }) => {
      if (displayedOnDevice) {
        emitEvent({ type: "confirmUpdate" });
      } else {
        emitEvent({ type: "downloadingUpdate", progress });
        if (progress) {
          // update progress bar on notification
          NativeModules.BackgroundRunner.update(Math.round(progress * 100));
        }
      }
    },
    error: onError,
    complete: () => {
      // Depending on the update path, we might need to run the firmwareMain or simply wait until
      // the device is online.

      if (
        latestFirmware.shouldFlashMCU ||
        hasFinalFirmware(latestFirmware.final)
      ) {
        // TODO adapt to the case where we enter auto-update here too, until then, the UI
        // will just show a 100% progress but still not completed if I got it right.
        emitEvent({ type: "flashingMcu" });
        mainFirmwareUpdate(deviceId, latestFirmware).subscribe({
          error: onError,
          complete: () => {
            emitEvent({ type: "confirmPin" });
            waitForOnlineDevice(5 * 60 * 1000).subscribe({
              error: onError,
              complete: () => emitEvent({ type: "firmwareUpdated" }),
            });
          },
        });
      } else {
        emitEvent({ type: "confirmPin" })
        // We're waiting forever condition that make getDeviceInfo work
        waitForOnlineDevice(5 * 60 * 1000).subscribe({
          error: onError,
          complete: () => emitEvent({ type: "firmwareUpdated" }),
        });
      }
    },
  });

  return null;
};

export default BackgroundRunnerService;
