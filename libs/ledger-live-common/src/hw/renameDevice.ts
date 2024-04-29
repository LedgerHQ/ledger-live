import { Observable, concat, from, of } from "rxjs";
import { map, catchError, switchMap, delay } from "rxjs/operators";
import { withDevice } from "./deviceAccess";
import editDeviceName from "./editDeviceName";
import quitApp from "./quitApp";

export type RenameDeviceEvent =
  | { type: "quitApp" }
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
  wired: boolean;
};

export default function renameDevice({
  deviceId,
  request,
  wired,
}: Input): Observable<RenameDeviceEvent> {
  const { name } = request;

  const quitAppFlow = withDevice(deviceId)(transport =>
    concat(
      from(quitApp(transport)).pipe(delay(wired ? 100 : 3000)),
      of(<RenameDeviceEvent>{
        type: "quitApp",
      }),
    ),
  );

  const renameAppFlow = withDevice(deviceId)(
    transport =>
      new Observable(o => {
        const innerSub = concat(
          of(<RenameDeviceEvent>{
            type: "permission-requested",
          }),
          from(editDeviceName(transport, name)),
        )
          .pipe(
            map(e => e || { type: "device-renamed", name }),
            catchError((error: Error) =>
              of({
                type: "error",
                error,
              }),
            ),
          )
          .subscribe(e => o.next(e));

        return () => {
          innerSub.unsubscribe();
        };
      }),
  );

  const sub = quitAppFlow.pipe(switchMap(_ => concat(renameAppFlow)));

  return sub as Observable<RenameDeviceEvent>;
}
