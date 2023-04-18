import { Observable, concat, from, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { withDevice } from "./deviceAccess";
import editDeviceName from "./editDeviceName";

export type RenameDeviceEvent =
  | {
      type: "unresponsiveDevice";
    }
  | {
      type: "permission-requested";
    }
  | {
      type: "device-renamed";
      name: string;
    };

export type RenameDeviceRequest = { name: string };
export type Input = {
  deviceId: string;
  request: RenameDeviceRequest;
};

export default function renameDevice({
  deviceId,
  request,
}: Input): Observable<RenameDeviceEvent> {
  const { name } = request;

  const sub = withDevice(deviceId)(
    (transport) =>
      new Observable((o) => {
        const sub = concat(
          of(<RenameDeviceEvent>{
            type: "permission-requested",
          }),
          from(editDeviceName(transport, name))
        )
          .pipe(
            map((e) => e || { type: "device-renamed", name }),
            catchError((error: Error) =>
              of({
                type: "error",
                error,
              })
            )
          )
          .subscribe((e) => o.next(e));

        return () => {
          sub.unsubscribe();
        };
      })
  );

  return sub as Observable<RenameDeviceEvent>;
}
