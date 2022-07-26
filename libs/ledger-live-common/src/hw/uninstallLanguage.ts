import { Observable, from, of, throwError, EMPTY } from "rxjs";
import { catchError, concatMap, delay, mergeMap } from "rxjs/operators";
import {
  DeviceOnDashboardExpected,
  TransportStatusError,
} from "@ledgerhq/errors";

import { withDevice } from "./deviceAccess";
import getDeviceInfo from "./getDeviceInfo";
import { Language, languageIds } from "../types/languages";
import { AppAndVersion } from "./connectApp";
import appSupportsQuitApp from "../appSupportsQuitApp";
import quitApp from "./quitApp";
import getAppAndVersion from "./getAppAndVersion";
import { isDashboardName } from "./isDashboardName";

export type UninstallLanguageEvent =
  | {
      type: "appDetected";
    }
  | {
      type: "unresponsiveDevice";
    }
  | {
      type: "languageUninstalled";
    };

const attemptToQuitApp = (
  transport,
  appAndVersion?: AppAndVersion
): Observable<UninstallLanguageEvent> =>
  appAndVersion && appSupportsQuitApp(appAndVersion)
    ? from(quitApp(transport)).pipe(
        concatMap(() =>
          of(<UninstallLanguageEvent>{
            type: "unresponsiveDevice",
          })
        ),
        catchError((e) => throwError(e))
      )
    : of({
        type: "appDetected",
      });

export type UninstallLanguageRequest = {
  deviceId: string;
  language: Language;
};

export default function unistallLanguage({
  deviceId,
  language,
}: UninstallLanguageRequest): Observable<UninstallLanguageEvent> {
  const sub = withDevice(deviceId)(
    (transport) =>
      new Observable<UninstallLanguageEvent>((subscriber) => {
        const timeoutSub = of<UninstallLanguageEvent>({
          type: "unresponsiveDevice",
        })
          .pipe(delay(1000))
          .subscribe((e) => subscriber.next(e));

        const sub = from(getDeviceInfo(transport))
          .pipe(
            mergeMap(async (_) => {
              timeoutSub.unsubscribe();

              const id = languageIds[language];

              await transport.send(
                0xe0,
                0x33,
                id,
                0x00,
                undefined,
                [0x9000, 0x5501] // Expected responses when uninstalling.
              );

              subscriber.next({
                type: "languageUninstalled",
              });

              subscriber.complete();
            }),
            catchError((e: Error) => {
              if (
                e instanceof DeviceOnDashboardExpected ||
                (e &&
                  e instanceof TransportStatusError &&
                  [0x6e00, 0x6d00, 0x6e01, 0x6d01, 0x6d02].includes(
                    // @ts-expect-error typescript not checking agains the instanceof
                    e.statusCode
                  ))
              ) {
                const quitAppObservable = from(
                  getAppAndVersion(transport)
                ).pipe(
                  concatMap((appAndVersion) => {
                    return !isDashboardName(appAndVersion.name)
                      ? attemptToQuitApp(transport, appAndVersion)
                      : of<UninstallLanguageEvent>({
                          type: "appDetected",
                        });
                  })
                );

                quitAppObservable.subscribe(
                  (event) => subscriber.next(event),
                  (error) => subscriber.error(error)
                );
              }

              subscriber.error(e);
              return EMPTY;
            })
          )
          .subscribe();

        return () => {
          timeoutSub.unsubscribe();
          sub.unsubscribe();
        };
      })
  );

  return sub;
}
