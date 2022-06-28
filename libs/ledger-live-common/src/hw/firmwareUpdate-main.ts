import { log } from "@ledgerhq/logs";
import { Observable, from, of, EMPTY, concat, throwError } from "rxjs";
import {
  concatMap,
  delay,
  scan,
  distinctUntilChanged,
  throttleTime,
} from "rxjs/operators";
import { CantOpenDevice, DeviceInOSUExpected } from "@ledgerhq/errors";
import { withDevicePolling, withDevice } from "./deviceAccess";
import getDeviceInfo from "./getDeviceInfo";
import flash from "./flash";
import installFinalFirmware from "./installFinalFirmware";
import { hasFinalFirmware } from "./hasFinalFirmware";
import type { FirmwareUpdateContext } from "@ledgerhq/types-live";
const wait2s = of({
  type: "wait",
}).pipe(delay(2000));
type Res = {
  installing: string | null | undefined;
  progress: number;
};

const main = (
  deviceId: string,
  { final, shouldFlashMCU }: FirmwareUpdateContext
): Observable<Res> => {
  log("hw", "firmwareUpdate-main started");
  const withFinal = hasFinalFirmware(final);
  const withDeviceInfo = withDevicePolling(deviceId)(
    (transport) => from(getDeviceInfo(transport)),
    () => true // accept all errors. we're waiting forever condition that make getDeviceInfo work
  );

  const withDeviceInstall = (install) =>
    withDevicePolling(deviceId)(
      install,
      (e) => e instanceof CantOpenDevice // this can happen if withDevicePolling was still seeing the device but it was then interrupted by a device reboot
    );

  const waitForBootloader = withDeviceInfo.pipe(
    concatMap((deviceInfo) =>
      deviceInfo.isBootloader ? EMPTY : concat(wait2s, waitForBootloader)
    )
  );
  const potentialAutoFlash = withDeviceInfo.pipe(
    concatMap((deviceInfo) =>
      deviceInfo.isOSU
        ? EMPTY
        : withDevice(deviceId)(
            (transport) =>
              new Observable((o) => {
                const timeout = setTimeout(() => {
                  log("firmware", "potentialAutoFlash timeout");
                  o.complete();
                }, 20000);

                const disconnect = () => {
                  log("firmware", "potentialAutoFlash disconnect");
                  o.complete();
                };

                transport.on("disconnect", disconnect);
                return () => {
                  clearTimeout(timeout);
                  transport.off("disconnect", disconnect);
                };
              })
          )
    )
  );
  const bootloaderLoop = withDeviceInfo.pipe(
    concatMap((deviceInfo) =>
      !deviceInfo.isBootloader
        ? EMPTY
        : concat(withDeviceInstall(flash(final)), wait2s, bootloaderLoop)
    )
  );
  const finalStep = !withFinal
    ? EMPTY
    : withDeviceInfo.pipe(
        concatMap((deviceInfo) =>
          !deviceInfo.isOSU
            ? throwError(new DeviceInOSUExpected())
            : withDeviceInstall(installFinalFirmware)
        )
      );
  const all = shouldFlashMCU
    ? concat(waitForBootloader, bootloaderLoop, finalStep)
    : concat(potentialAutoFlash, finalStep);
  return all.pipe(
    scan(
      (acc: Res, e: any): Res => {
        if (e.type === "install") {
          return {
            installing: e.step,
            progress: 0,
          };
        }

        if (e.type === "bulk-progress") {
          return { ...acc, progress: e.progress };
        }

        return acc;
      },
      {
        progress: 0,
        installing: null,
      }
    ),
    distinctUntilChanged(),
    throttleTime(100)
  );
};

export default main;
