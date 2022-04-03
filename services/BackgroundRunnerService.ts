import { log } from "@ledgerhq/logs";
import { withDevicePolling } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import { from } from "rxjs";
import { timeout } from "rxjs/operators";
import { NativeModules } from "react-native";
import { hasFinalFirmware } from "@ledgerhq/live-common/lib/hw/hasFinalFirmware";
import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/live-common/lib/types/manager";
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
  serializedFirmware
}: {
  deviceId: string;
  serializedFirmware: string;
}) => {
  const emitEvent = (e: BackgroundEvent) => store.dispatch(addBackgroundEvent(e));
  const latestFirmware = JSON.parse(serializedFirmware);

  emitEvent({ type: "LOG", deviceId, serializedFirmware });

  if (!latestFirmware) {
    log(TAG, "no need to update");
    emitEvent({ type: "completed" });
    return 0;
  }

  const onNext = (event: {
    type: "progress",
    progress?: number,
    displayedOnDevice?: any
  }) => {
    
    emitEvent({ ...event, type: "progress" }); // Forward them up so UI JS can update itself.
    const { progress, displayedOnDevice } = event;
    if (displayedOnDevice) {
      NativeModules.BackgroundRunner.requireUserAction("firmware version");
    } else if (progress) {
      NativeModules.BackgroundRunner.update(
        Math.round(progress * 100),
      );
    }
  };

  const onError = (error: any) => {
    emitEvent({ type: "error", error });
    NativeModules.BackgroundRunner.stop();
  };

  const onComplete = () => {
    log(TAG, "completed firmware update");
    emitEvent({ type: "completed" });
  };

  prepareFirmwareUpdate(deviceId, latestFirmware).subscribe({
    next: onNext,
    error: onError,
    complete: () => {
      // Depending on the update path, we might need to run the firmwareMain or simply wait
      emitEvent({ type: "completed" });
      emitEvent({ type: "YOLO" });
      if (
        latestFirmware.shouldFlashMCU ||
        hasFinalFirmware(latestFirmware.final)
      ) {
        emitEvent({ type: "LOG: main update", should: latestFirmware.shouldFlashMCU, has: hasFinalFirmware(latestFirmware.final) });
        // TODO adapt to the case where we enter auto-update here too, until then, the UI
        // will just show a 100% progress but still not completed if I got it right.
        mainFirmwareUpdate(deviceId, latestFirmware).subscribe({
          next: (a) => { console.log("main next"); onNext(a)},
          error: onError,
          complete: onComplete,
        });
      } else {
        emitEvent({ type: "LOG: device polling" });
        // We're waiting forever condition that make getDeviceInfo work
        withDevicePolling(deviceId)(
          t => from(getDeviceInfo(t)),
          () => true,
        )
          .pipe(timeout(5 * 60 * 1000))
          .subscribe({
            error: onError,
            complete: onComplete,
          });
      }
    },
  });

  return null;
};

export default BackgroundRunnerService;
