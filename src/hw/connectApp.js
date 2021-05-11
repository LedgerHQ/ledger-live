// @flow

import { Observable, concat, from, of, throwError, defer } from "rxjs";
import { concatMap, map, catchError, delay } from "rxjs/operators";
import {
  TransportStatusError,
  FirmwareOrAppUpdateRequired,
  UserRefusedOnDevice,
  BtcUnmatchedApp,
  UpdateYourApp,
  DisconnectedDeviceDuringOperation,
  DisconnectedDevice,
} from "@ledgerhq/errors";
import type Transport from "@ledgerhq/hw-transport";
import type { DeviceModelId } from "@ledgerhq/devices";
import type { DerivationMode } from "../types";
import { getCryptoCurrencyById } from "../currencies";
import appSupportsQuitApp from "../appSupportsQuitApp";
import { withDevice } from "./deviceAccess";
import { streamAppInstall } from "../apps/hw";
import { isDashboardName } from "./isDashboardName";
import getAppAndVersion from "./getAppAndVersion";
import getAddress from "./getAddress";
import openApp from "./openApp";
import quitApp from "./quitApp";
import { mustUpgrade } from "../apps";
import { getEnv } from "../env";
export type RequiresDerivation = {|
  currencyId: string,
  path: string,
  derivationMode: DerivationMode,
  forceFormat?: string,
|};

export type Input = {
  modelId: DeviceModelId,
  devicePath: string,
  appName: string,
  requiresDerivation?: RequiresDerivation,
  dependencies?: string[],
};

export type AppAndVersion = {
  name: string,
  version: string,
  flags: number,
};

export type ConnectAppEvent =
  | { type: "unresponsiveDevice" }
  | { type: "disconnected" }
  | {
      type: "device-permission-requested",
      wording: string,
    }
  | { type: "device-permission-granted" }
  | { type: "app-not-installed", appNames: string[], appName: string }
  | { type: "stream-install", progress: number }
  | { type: "listing-apps" }
  | { type: "dependencies-resolved" }
  | { type: "ask-quit-app" }
  | { type: "ask-open-app", appName: string }
  | { type: "opened", app?: AppAndVersion, derivation?: { address: string } }
  | { type: "display-upgrade-warning", displayUpgradeWarning: boolean };

export const openAppFromDashboard = (
  transport: Transport<*>,
  appName: string
): Observable<ConnectAppEvent> =>
  concat(
    of({ type: "ask-open-app", appName }),
    defer(() => from(openApp(transport, appName))).pipe(
      concatMap(() => of({ type: "device-permission-granted" })),
      catchError((e) => {
        if (e && e instanceof TransportStatusError) {
          switch (e.statusCode) {
            case 0x6984:
            case 0x6807:
              return getEnv("EXPERIMENTAL_INLINE_INSTALL")
                ? streamAppInstall({
                    transport,
                    appNames: [appName],
                    onSuccessObs: () =>
                      from(openAppFromDashboard(transport, appName)),
                  })
                : of({
                    type: "app-not-installed",
                    appName,
                    appNames: [appName],
                  });
            case 0x6985:
            case 0x5501:
              return throwError(new UserRefusedOnDevice());
          }
        }
        return throwError(e);
      })
    )
  );

const attemptToQuitApp = (
  transport,
  appAndVersion?: AppAndVersion
): Observable<ConnectAppEvent> =>
  appAndVersion && appSupportsQuitApp(appAndVersion)
    ? from(quitApp(transport)).pipe(
        concatMap(() => of({ type: "disconnected" })),
        catchError((e) => throwError(e))
      )
    : of({ type: "ask-quit-app" });

const derivationLogic = (
  transport,
  {
    requiresDerivation: { currencyId, ...derivationRest },
    appAndVersion,
    appName,
  }: {
    requiresDerivation: RequiresDerivation,
    appAndVersion?: AppAndVersion,
    appName: string,
  }
): Observable<ConnectAppEvent> =>
  defer(() =>
    from(
      getAddress(transport, {
        currency: getCryptoCurrencyById(currencyId),
        ...derivationRest,
      })
    )
  ).pipe(
    map(({ address }) => ({
      type: "opened",
      app: appAndVersion,
      derivation: { address },
    })),
    catchError((e) => {
      if (!e) return throwError(e);
      if (e instanceof BtcUnmatchedApp) {
        return of({ type: "ask-open-app", appName });
      }

      if (e instanceof TransportStatusError) {
        const { statusCode } = e;
        if (
          statusCode === 0x6982 ||
          statusCode === 0x6700 ||
          (0x6600 <= statusCode && statusCode <= 0x67ff)
        ) {
          return of({ type: "ask-open-app", appName });
        }
        switch (statusCode) {
          case 0x6f04: // FW-90. app was locked...
          case 0x6faa: // FW-90. app bricked, a reboot fixes it.
          case 0x6d00: // this is likely because it's the wrong app (LNS 1.3.1)
            return attemptToQuitApp(transport, appAndVersion);
        }
      }
      return throwError(e);
    })
  );

const cmd = ({
  modelId,
  devicePath,
  appName,
  requiresDerivation,
  dependencies,
}: Input): Observable<ConnectAppEvent> =>
  withDevice(devicePath)((transport) =>
    Observable.create((o) => {
      const timeoutSub = of({ type: "unresponsiveDevice" })
        .pipe(delay(1000))
        .subscribe((e) => o.next(e));

      const innerSub = ({ appName, dependencies }: any) =>
        defer(() => from(getAppAndVersion(transport))).pipe(
          concatMap((appAndVersion): Observable<ConnectAppEvent> => {
            timeoutSub.unsubscribe();

            if (isDashboardName(appAndVersion.name)) {
              // check if we meet dependencies
              if (dependencies?.length) {
                return streamAppInstall({
                  transport,
                  appNames: [appName, ...dependencies],
                  onSuccessObs: () => {
                    o.next({ type: "dependencies-resolved" });
                    return innerSub({ appName }); // NB without deps
                  },
                });
              }
              // we're in dashboard
              return openAppFromDashboard(transport, appName);
            }

            if (dependencies?.length || appAndVersion.name !== appName) {
              return attemptToQuitApp(transport, appAndVersion);
            }

            if (
              mustUpgrade(modelId, appAndVersion.name, appAndVersion.version)
            ) {
              return throwError(
                new UpdateYourApp(null, {
                  managerAppName: appAndVersion.name,
                })
              );
            }

            if (requiresDerivation) {
              return derivationLogic(transport, {
                requiresDerivation,
                appAndVersion,
                appName,
              });
            } else {
              const e: ConnectAppEvent = {
                type: "opened",
                app: appAndVersion,
              };
              return of(e);
            }
          }),
          catchError((e: Error) => {
            if (
              e instanceof DisconnectedDeviceDuringOperation ||
              e instanceof DisconnectedDevice
            ) {
              return of({ type: "disconnected" });
            }
            if (
              e &&
              e instanceof TransportStatusError &&
              (e.statusCode === 0x6e00 || // in 1.3.1 dashboard
                e.statusCode === 0x6d00) // in 1.3.1 and bitcoin app
            ) {
              // fallback on "old way" because device does not support getAppAndVersion
              if (!requiresDerivation) {
                // if there is no derivation, there is nothing we can do to check an app (e.g. requiring non coin app)
                return throwError(new FirmwareOrAppUpdateRequired());
              }
              return derivationLogic(transport, {
                requiresDerivation,
                appName,
              });
            }
            return throwError(e);
          })
        );
      const sub = innerSub({ appName, dependencies }).subscribe(o);

      return () => {
        timeoutSub.unsubscribe();
        sub.unsubscribe();
      };
    })
  );

export default cmd;
