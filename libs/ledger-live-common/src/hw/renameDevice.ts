import { Observable, concat, defer, from, of } from "rxjs";
import { catchError, concatMap, map, retry, switchMap } from "rxjs/operators";
import { retryWhileErrors, withDevice } from "./deviceAccess";
import editDeviceName from "./editDeviceName";
import getAppAndVersion from "./getAppAndVersion";
import { isDashboardName } from "./isDashboardName";
// import attemptToQuitApp from "./attemptToQuitApp";
import quitApp from "./quitApp";

export type RenameDeviceEvent =
  | { type: "attemptToQuitApp" }
  | { type: "onDashboard" }
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
  request, // wired,
}: Input): Observable<RenameDeviceEvent> {
  const { name } = request;

  // const sub: Observable<RenameDeviceEvent> = withDevice(deviceId)((transport): any => {
  //   const innerSub = () =>
  //     defer(() => from(getAppAndVersion(transport))).pipe(
  //       concatMap(appAndVersion => {
  //         if (!isDashboardName(appAndVersion.name)) {
  //           return concat(
  //             attemptToQuitApp(transport),
  //             of(<RenameDeviceEvent>{
  //               type: "attemptToQuitApp",
  //             }),
  //             innerSub(),
  //           );
  //         }

  //         return new Observable(o => {
  //           return concat(
  //             of(<RenameDeviceEvent>{
  //               type: "permission-requested",
  //             }),
  //             from(editDeviceName(transport, name)),
  //           )
  //             .pipe(
  //               map(e => e || { type: "device-renamed", name }),
  //               catchError((error: Error) =>
  //                 of({
  //                   type: "error",
  //                   error,
  //                 }),
  //               ),
  //             )
  //             .subscribe(e => o.next(e));
  //         });
  //       }),
  //     );

  //   return innerSub;
  // });

  const sub = withDevice(deviceId)(transport =>
    defer(() => from(getAppAndVersion(transport))).pipe(
      switchMap(appAndVersion => {
        if (!isDashboardName(appAndVersion.name)) {
          return from(quitApp(transport)).pipe(
            switchMap(() => {
              throw new Error("not on dashboard");
            }),
          );
        }

        return concat(
          of(<RenameDeviceEvent>{
            type: "permission-requested",
          }),
          from(editDeviceName(transport, name)),
        );
      }),
    ),
  ).pipe(retryWhileErrors((_e: Error) => true));

  // const sub = withDevice(deviceId)(transport =>
  //   defer(() => from(quitApp(transport)))
  //     .pipe(
  //       switchMap(() => {
  //         return from(getAppAndVersion(transport)).pipe(
  //           map(appAndVersion => {
  //             if (!isDashboardName(appAndVersion.name)) {
  //               throw new Error("not on dashboard");
  //             }

  //             return of(<RenameDeviceEvent>{
  //               type: "onDashboard",
  //             });
  //           }),
  //           retry({ delay: 500 }),
  //         );
  //       }),
  //     )
  //     .pipe(
  //       switchMap(() => {
  //         return new Observable(o => {
  //           const innerSub = concat(
  //             of(<RenameDeviceEvent>{
  //               type: "permission-requested",
  //             }),
  //             from(editDeviceName(transport, name)),
  //           )
  //             .pipe(
  //               map(e => e || { type: "device-renamed", name }),
  //               catchError((error: Error) =>
  //                 of({
  //                   type: "error",
  //                   error,
  //                 }),
  //               ),
  //             )
  //             .subscribe(e => o.next(e));

  //           return () => {
  //             innerSub.unsubscribe();
  //           };
  //         });
  //       }),
  //     ),
  // );

  // const renameAppFlow = withDevice(deviceId)(
  //   transport =>
  //     new Observable(o => {
  //       const innerSub = concat(
  //         of(<RenameDeviceEvent>{
  //           type: "permission-requested",
  //         }),
  //         from(editDeviceName(transport, name)),
  //       )
  //         .pipe(
  //           map(e => e || { type: "device-renamed", name }),
  //           catchError((error: Error) =>
  //             of({
  //               type: "error",
  //               error,
  //             }),
  //           ),
  //         )
  //         .subscribe(e => o.next(e));

  //       return () => {
  //         innerSub.unsubscribe();
  //       };
  //     }),
  // );

  // const sub = quitAppFlow.pipe(switchMap(_ => concat(renameAppFlow)));

  return sub as Observable<RenameDeviceEvent>;
}
