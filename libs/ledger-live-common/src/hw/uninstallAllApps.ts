import { TransportStatusError, StatusCodes, UserRefusedOnDevice } from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";
import { Observable, from, of } from "rxjs";
import { withDevice } from "./deviceAccess";
import { delay, mergeMap } from "rxjs/operators";
import getDeviceInfo from "./getDeviceInfo";

export type UninstallAllAppsEvent =
  | {
      type: "unresponsiveDevice";
    }
  | {
      type: "uninstallAppsPermissionRequested";
    }
  | {
      type: "appsUninstalled";
    };

export type Input = {
  deviceId: string;
  request: Record<string, unknown>;
};

/**
 * Prompt the user to uninstall all applications at once in order to avoid
 * having to iterate over the installed applications one by one. This avoid
 * unnnecesary HSM connections, speeds up the flow and improves the UX.
 */
export const command = async (transport: Transport): Promise<boolean> => {
  const res = await transport.send(0xe0, 0x6dd, 0x00, 0x00, Buffer.from([]), [
    StatusCodes.OK,
    StatusCodes.UNKNOWN_APDU,
    StatusCodes.USER_REFUSED_ON_DEVICE,
    StatusCodes.UNKNOWN_APDU,
  ]);

  const status = res.readUInt16BE(res.length - 2);

  // We can complete with OK/KO, if the APDU is not available we can continue
  // with the legacy queue based HSM uninstall, if we succeed, we can clear
  // the queue.
  switch (status) {
    case StatusCodes.OK:
      return true;
    case StatusCodes.USER_REFUSED_ON_DEVICE:
      throw new UserRefusedOnDevice();
    case StatusCodes.UNKNOWN_APDU:
      return false;
  }
  throw new TransportStatusError(status);
};

export default function uninstallAllApps({ deviceId }: Input): Observable<UninstallAllAppsEvent> {
  const sub = withDevice(deviceId)(
    transport =>
      new Observable(subscriber => {
        const timeoutSub = of<UninstallAllAppsEvent>({
          type: "unresponsiveDevice",
        })
          .pipe(delay(1000))
          .subscribe(e => subscriber.next(e));

        const sub = from(getDeviceInfo(transport))
          .pipe(
            mergeMap(async () => {
              timeoutSub.unsubscribe();
              subscriber.next({ type: "uninstallAllAppsPermissionRequested" });
              await command(transport);
              subscriber.next({ type: "appsUninstalled" });
            }),
          )
          .subscribe(subscriber);

        return () => {
          timeoutSub.unsubscribe();
          sub.unsubscribe();
        };
      }),
  );

  return sub as Observable<UninstallAllAppsEvent>;
}
