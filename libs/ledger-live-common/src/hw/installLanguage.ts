import { Observable, from, of, EMPTY, throwError } from "rxjs";
import { catchError, concatMap, delay, mergeMap } from "rxjs/operators";
import { DeviceOnDashboardExpected, TransportError, TransportStatusError, LanguageNotFound } from "@ledgerhq/errors";

import ManagerAPI from "../api/Manager";
import { withDevice } from "./deviceAccess";
import getDeviceInfo from "./getDeviceInfo";
import { Language, languageIds, LanguagePackage } from "../types/languages";
import network from "../network";
import { LanguageInstallRefusedOnDevice } from "../errors";
import getAppAndVersion from "./getAppAndVersion";
import { isDashboardName } from "./isDashboardName";
import Transport from "@ledgerhq/hw-transport";
import attemptToQuitApp, { AttemptToQuitAppEvent } from "./attemptToQuitApp";

export type InstallLanguageEvent =
  | AttemptToQuitAppEvent
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
      new Observable((subscriber) => {
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
                await uninstallAllLanguages(transport);

                subscriber.next({
                  type: "languageInstalled",
                });
                subscriber.complete();

                return;
              }

              const languages = await ManagerAPI.getLanguagePackagesForDevice(deviceInfo);

              const packs: LanguagePackage[] = languages.filter((l: any) => l.language === language);

              if (!packs.length) return subscriber.error(new LanguageNotFound(language));

              const pack = packs[0];
              const { apdu_install_url } = pack;
              const url = apdu_install_url;

              const { data: rawApdus } = await network({
                method: "GET",
                url,
              });

              const apdus = rawApdus.split(/\r?\n/).filter(Boolean);

              await uninstallAllLanguages(transport);

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
                return from(getAppAndVersion(transport)).pipe(
                  concatMap((appAndVersion) => {
                    return !isDashboardName(appAndVersion.name)
                      ? attemptToQuitApp(transport, appAndVersion)
                      : of<InstallLanguageEvent>({
                          type: "appDetected",
                        });
                  })
                );
              }
              
              return throwError(e);
            })
          )
          .subscribe(subscriber);

        return () => {
          timeoutSub.unsubscribe();
          sub.unsubscribe();
        };
      })
  );

  return sub as Observable<InstallLanguageEvent>;
}

const uninstallAllLanguages = async (transport: Transport) => {
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
