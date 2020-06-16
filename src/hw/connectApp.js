// @flow

import { Observable, concat, from, of, throwError, defer } from "rxjs";
import { concatMap, map, catchError, delay } from "rxjs/operators";
import {
  TransportStatusError,
  FirmwareOrAppUpdateRequired,
  UserRefusedOnDevice,
  BtcUnmatchedApp,
  UpdateYourApp,
} from "@ledgerhq/errors";
import type { DeviceModelId } from "@ledgerhq/devices";
import { getEnv } from "../env";
import type { DerivationMode } from "../types";
import { getCryptoCurrencyById } from "../currencies";
import { withDevice } from "./deviceAccess";
import getAppAndVersion from "./getAppAndVersion";
import getAddress from "./getAddress";
import openApp from "./openApp";
import { mustUpgrade, shouldUpgrade } from "../apps";

export type RequiresDerivation = {|
  currencyId: string,
  derivationPath: string,
  derivationMode: DerivationMode,
|};

export type Input = {
  modelId: DeviceModelId,
  devicePath: string,
  appName: string,
  requiresDerivation?: RequiresDerivation,
};

export type AppAndVersion = {
  name: string,
  version: string,
  flags: number,
};

export type ConnectAppEvent =
  | { type: "unresponsiveDevice" }
  | { type: "device-permission-requested", wording: string }
  | { type: "device-permission-granted" }
  | { type: "app-not-installed", appName: string }
  | { type: "ask-quit-app" }
  | { type: "ask-open-app", appName: string }
  | { type: "opened", app?: AppAndVersion, derivation?: { address: string } }
  | { type: "display-upgrade-warning", displayUpgradeWarning: boolean };

const dashboardNames = ["BOLOS", "OLOS\u0000"];

const openAppFromDashboard = (
  transport,
  appName
): Observable<ConnectAppEvent> =>
  !getEnv("EXPERIMENTAL_DEVICE_FLOW")
    ? of({ type: "ask-open-app", appName })
    : concat(
        // TODO optim: the requested should happen a better in a deferred way because openApp might error straightaway instead
        of({ type: "device-permission-requested", wording: appName }),
        defer(() => from(openApp(transport, appName))).pipe(
          concatMap(() => of({ type: "device-permission-granted" })),
          catchError((e) => {
            if (e && e instanceof TransportStatusError) {
              switch (e.statusCode) {
                case 0x6984:
                case 0x6807:
                  return of({ type: "app-not-installed", appName });
                case 0x6985:
                case 0x5501:
                  return throwError(new UserRefusedOnDevice());
              }
            }
            return throwError(e);
          })
        )
      );

const derivationLogic = (
  transport,
  {
    requiresDerivation,
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
        currency: getCryptoCurrencyById(requiresDerivation.currencyId),
        path: requiresDerivation.derivationPath,
        derivationMode: requiresDerivation.derivationMode,
      })
    )
  ).pipe(
    map(({ address }) => ({
      type: "opened",
      appAndVersion,
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
            return of({ type: "ask-quit-app" });
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
}: Input): Observable<ConnectAppEvent> =>
  withDevice(devicePath)((transport) =>
    Observable.create((o) => {
      const timeoutSub = of({ type: "unresponsiveDevice" })
        .pipe(delay(1000))
        .subscribe((e) => o.next(e));

      const sub = defer(() => from(getAppAndVersion(transport)))
        .pipe(
          concatMap((appAndVersion): Observable<ConnectAppEvent> => {
            timeoutSub.unsubscribe();

            if (dashboardNames.includes(appAndVersion.name)) {
              // we're in dashboard
              return openAppFromDashboard(transport, appName);
            }

            if (appAndVersion.name !== appName) {
              return of({ type: "ask-quit-app" });
            }

            if (
              mustUpgrade(modelId, appAndVersion.name, appAndVersion.version)
            ) {
              return throwError(
                new UpdateYourApp(null, { managerAppName: appAndVersion.name })
              );
            }

            if (requiresDerivation) {
              return derivationLogic(transport, {
                requiresDerivation,
                appAndVersion,
                appName,
              });
            }

            if (
              shouldUpgrade(modelId, appAndVersion.name, appAndVersion.version)
            ) {
              return concat(
                of({
                  type: "display-upgrade-warning",
                  displayUpgradeWarning: true,
                }),
                of({ type: "opened", appAndVersion })
              );
            } else {
              const e: ConnectAppEvent = { type: "opened", appAndVersion };
              return of(e);
            }
          }),
          catchError((e: Error) => {
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
        )
        .subscribe(o);

      return () => {
        timeoutSub.unsubscribe();
        sub.unsubscribe();
      };
    })
  );

export default cmd;
