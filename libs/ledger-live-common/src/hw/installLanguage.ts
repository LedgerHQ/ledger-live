import { Observable, from, of, throwError, EMPTY } from "rxjs";
import { catchError, concatMap, delay, mergeMap } from "rxjs/operators";
import { DeviceOnDashboardExpected, TransportError, TransportStatusError } from "@ledgerhq/errors";

import ManagerAPI from "../api/Manager";
import { withDevice } from "./deviceAccess";
import getDeviceInfo from "./getDeviceInfo";
import { Language, languageIds, LanguagePackage } from "../types/languages";
import network from "../network";
import { LanguageInstallRefusedOnDevice } from "../errors";
import { AppAndVersion } from "./connectApp";
import appSupportsQuitApp from "../appSupportsQuitApp";
import quitApp from "./quitApp";
import getAppAndVersion from "./getAppAndVersion";
import { isDashboardName } from "./isDashboardName";
import Transport from "@ledgerhq/hw-transport";

export type InstallLanguageEvent =
  | {
      type: "appDetected";
    }
  | {
      type: "unresponsiveDevice";
    }
  | {
      type: "progress";
      progress: number;
    }
  | {
      type: "devicePermissionRequested";
    }
  | {
      type: "languageInstalled";
    };

const attemptToQuitApp = (transport, appAndVersion?: AppAndVersion): Observable<InstallLanguageEvent> =>
  appAndVersion && appSupportsQuitApp(appAndVersion)
    ? from(quitApp(transport)).pipe(
        concatMap(() =>
          of(<InstallLanguageEvent>{
            type: "unresponsiveDevice",
          })
        ),
        catchError((e) => throwError(e))
      )
    : of({
        type: "appDetected",
      });

export type InstallLanguageRequest = {
  deviceId: string;
  language: Language;
};

export default function installLanguage({
  deviceId,
  language,
}: InstallLanguageRequest): Observable<InstallLanguageEvent> {
  const sub = withDevice(deviceId)(
    (transport) =>
      new Observable<InstallLanguageEvent>((subscriber) => {
        const timeoutSub = of<InstallLanguageEvent>({
          type: "unresponsiveDevice",
        })
          .pipe(delay(1000))
          .subscribe((e) => subscriber.next(e));

        const sub = from(getDeviceInfo(transport))
          .pipe(
            mergeMap(async (deviceInfo) => {
              timeoutSub.unsubscribe();

              if (language === "english") {
                await uninstallAllLanugages(transport);
                subscriber.next({
                  type: "languageInstalled",
                });
                subscriber.complete();
                return;
              }

              const languages = await ManagerAPI.getLanguagePackagesForDevice(deviceInfo);

              const packs: LanguagePackage[] = languages.filter((l: any) => l.language === language);

              if (!packs.length) return subscriber.error(new Error(`No language ${language} found`));

              const pack = packs[0];

              const { apdu_install_url } = pack;
              const url = apdu_install_url;

              const { data: rawApdus } = await network({
                method: "GET",
                url,
              });

              const apdus = rawApdus.split(/\r?\n/).filter(Boolean);

              await uninstallAllLanugages(transport);

              for (let i = 0; i < apdus.length; i++) {
                if (apdus[i].startsWith("e030")) {
                  subscriber.next({
                    type: "devicePermissionRequested",
                  });
                }

                const response = await transport.exchange(Buffer.from(apdus[i], "hex"));
                const status = response.readUInt16BE(response.length - 2);
                const statusStr = status.toString(16);

                // Some error handling
                if (status === 0x5501) {
                  return subscriber.error(new LanguageInstallRefusedOnDevice(statusStr));
                } else if (status !== 0x9000) {
                  return subscriber.error(new TransportError("Unexpected device response", statusStr));
                }

                subscriber.next({
                  type: "progress",
                  progress: (i + 1) / apdus.length,
                });
              }

              subscriber.next({
                type: "languageInstalled",
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
                const quitAppObservable = from(getAppAndVersion(transport)).pipe(
                  concatMap((appAndVersion) => {
                    return !isDashboardName(appAndVersion.name)
                      ? attemptToQuitApp(transport, appAndVersion)
                      : of<InstallLanguageEvent>({
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

const uninstallAllLanugages = async (transport: Transport) => {
  // TODO: in a future FW version, this will be a single apdu
  for (const id of Object.values(languageIds)) {
    // do we want to reflect this on the UI? do we need to emit events here
    // what about error handling, maybe unhandled promise rejection might happen
    // at least try catch
    await transport.send(
      0xe0,
      0x33,
      id,
      0x00,
      undefined,
      [0x9000, 0x5501] // Expected responses when uninstalling.
    );
  }
};
