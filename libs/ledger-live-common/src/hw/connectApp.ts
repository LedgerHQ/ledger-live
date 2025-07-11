import semver from "semver";
import { Observable, concat, from, of, throwError, defer, merge } from "rxjs";
import { mergeMap, concatMap, map, catchError, delay } from "rxjs/operators";
import {
  TransportStatusError,
  FirmwareOrAppUpdateRequired,
  UserRefusedOnDevice,
  BtcUnmatchedApp,
  UpdateYourApp,
  DisconnectedDeviceDuringOperation,
  DisconnectedDevice,
  StatusCodes,
  LockedDeviceError,
  LatestFirmwareVersionRequired,
} from "@ledgerhq/errors";
import type Transport from "@ledgerhq/hw-transport";
import { type DerivationMode, DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import type { AppOp, SkippedAppOp } from "../apps/types";
import { getCryptoCurrencyById } from "../currencies";
import appSupportsQuitApp from "../appSupportsQuitApp";
import { withDevice } from "./deviceAccess";
import inlineAppInstall from "../apps/inlineAppInstall";
import { isDashboardName } from "./isDashboardName";
import getAppAndVersion from "./getAppAndVersion";
import getDeviceInfo from "./getDeviceInfo";
import getAddress from "./getAddress";
import openApp from "./openApp";
import quitApp from "./quitApp";
import { mustUpgrade, getMinVersion } from "../apps";
import isUpdateAvailable from "./isUpdateAvailable";
import { LockedDeviceEvent } from "./actions/types";
import { getLatestFirmwareForDeviceUseCase } from "../device/use-cases/getLatestFirmwareForDeviceUseCase";
import {
  type ApplicationDependency,
  type ApplicationConstraint,
  type ApplicationVersionConstraint,
  type DeviceManagementKit,
  DeviceModelId,
} from "@ledgerhq/device-management-kit";
import { ConnectAppDeviceAction } from "@ledgerhq/live-dmk-shared";
import { ConnectAppEventMapper } from "./connectAppEventMapper";

export type RequiresDerivation = {
  currencyId: string;
  path: string;
  derivationMode: DerivationMode;
  forceFormat?: string;
};
export type Input = {
  deviceId: string;
  request: ConnectAppRequest;
};
export type ConnectAppRequest = {
  appName: string;
  requiresDerivation?: RequiresDerivation;
  dependencies?: string[];
  requireLatestFirmware?: boolean;
  outdatedApp?: AppAndVersion;
  allowPartialDependencies: boolean;
};

export type AppAndVersion = {
  name: string;
  version: string;
  flags: number | Buffer;
};
export type ConnectAppEvent =
  | {
      type: "unresponsiveDevice";
    }
  | {
      type: "disconnected";
      expected?: boolean;
    }
  | {
      type: "device-update-last-seen";
      deviceInfo: DeviceInfo;
      latestFirmware: FirmwareUpdateContext | null | undefined;
    }
  | {
      type: "device-permission-requested";
    }
  | {
      type: "device-permission-granted";
    }
  | {
      type: "app-not-installed";
      appNames: string[];
      appName: string;
    }
  | {
      type: "inline-install";
      progress: number;
      itemProgress: number;
      currentAppOp: AppOp;
      installQueue: string[];
    }
  | {
      type: "some-apps-skipped";
      skippedAppOps: SkippedAppOp[];
    }
  | {
      type: "listing-apps";
    }
  | {
      type: "listed-apps";
      installQueue: string[];
    }
  | {
      type: "dependencies-resolved";
    }
  | {
      type: "latest-firmware-resolved";
    }
  | {
      type: "ask-quit-app";
    }
  | {
      type: "ask-open-app";
      appName: string;
    }
  | {
      type: "has-outdated-app";
      outdatedApp: AppAndVersion;
    }
  | {
      type: "opened";
      app?: AppAndVersion;
      derivation?: {
        address: string;
      };
    }
  | {
      type: "display-upgrade-warning";
      displayUpgradeWarning: boolean;
    }
  | LockedDeviceEvent;

export const openAppFromDashboard = (
  transport: Transport,
  appName: string,
): Observable<ConnectAppEvent> =>
  from(getDeviceInfo(transport)).pipe(
    mergeMap(deviceInfo =>
      merge(
        // Nb Allows LLD/LLM to update lastSeenDevice, this can run in parallel
        // since there are no more device exchanges.
        from(getLatestFirmwareForDeviceUseCase(deviceInfo)).pipe(
          concatMap(latestFirmware =>
            of<ConnectAppEvent>({
              type: "device-update-last-seen",
              deviceInfo,
              latestFirmware,
            }),
          ),
        ),
        concat(
          of<ConnectAppEvent>({
            type: "ask-open-app",
            appName,
          }),
          defer(() => from(openApp(transport, appName))).pipe(
            concatMap(() =>
              of<ConnectAppEvent>({
                type: "device-permission-granted",
              }),
            ),
            catchError(e => {
              if (e && e instanceof TransportStatusError) {
                switch (e.statusCode) {
                  case 0x6984: // No StatusCodes definition
                  case 0x6807: // No StatusCodes definition
                    return inlineAppInstall({
                      transport,
                      appNames: [appName],
                      onSuccessObs: () => from(openAppFromDashboard(transport, appName)),
                    }) as Observable<ConnectAppEvent>;
                  case StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED:
                  case 0x5501: // No StatusCodes definition
                    return throwError(() => new UserRefusedOnDevice());
                }
              } else if (e instanceof LockedDeviceError) {
                // openAppFromDashboard is exported, so LockedDeviceError should be handled here too
                return of({
                  type: "lockedDevice",
                } as ConnectAppEvent);
              }

              return throwError(() => e);
            }),
          ),
        ),
      ),
    ),
  );

const attemptToQuitApp = (transport, appAndVersion?: AppAndVersion): Observable<ConnectAppEvent> =>
  appAndVersion && appSupportsQuitApp(appAndVersion)
    ? from(quitApp(transport)).pipe(
        concatMap(() =>
          of<ConnectAppEvent>({
            type: "disconnected",
            expected: true,
          }),
        ),
        catchError(e => throwError(() => e)),
      )
    : of({
        type: "ask-quit-app",
      });

const derivationLogic = (
  transport: Transport,
  {
    requiresDerivation: { currencyId, ...derivationRest },
    appAndVersion,
    appName,
  }: {
    requiresDerivation: RequiresDerivation;
    appAndVersion?: AppAndVersion;
    appName: string;
  },
): Observable<ConnectAppEvent> =>
  defer(() =>
    from(
      getAddress(transport, {
        currency: getCryptoCurrencyById(currencyId),
        ...derivationRest,
      }),
    ),
  ).pipe(
    map<any, ConnectAppEvent>(({ address }) => ({
      type: "opened",
      app: appAndVersion,
      derivation: {
        address,
      },
    })),
    catchError(e => {
      if (!e) return throwError(() => e);

      if (e instanceof BtcUnmatchedApp) {
        return of<ConnectAppEvent>({
          type: "ask-open-app",
          appName,
        });
      }

      if (e instanceof TransportStatusError) {
        const { statusCode } = e;

        if (
          statusCode === StatusCodes.SECURITY_STATUS_NOT_SATISFIED ||
          statusCode === StatusCodes.INCORRECT_LENGTH ||
          (0x6600 <= statusCode && statusCode <= 0x67ff)
        ) {
          return of<ConnectAppEvent>({
            type: "ask-open-app",
            appName,
          });
        }

        switch (statusCode) {
          case 0x6f04: // FW-90. app was locked... | No StatusCodes definition
          case StatusCodes.HALTED: // FW-90. app bricked, a reboot fixes it.
          case StatusCodes.INS_NOT_SUPPORTED:
            // this is likely because it's the wrong app (LNS 1.3.1)
            return attemptToQuitApp(transport, appAndVersion);
        }
      } else if (e instanceof LockedDeviceError) {
        // derivationLogic is also called inside the catchError of cmd below
        // so it needs to handle LockedDeviceError too
        return of({
          type: "lockedDevice",
        } as ConnectAppEvent);
      }

      return throwError(() => e);
    }),
  );

/**
 * @param allowPartialDependencies If some dependencies need to be installed, and if set to true,
 *   skip any app install if the app is not found from the provider.
 */
const cmd = (transport: Transport, { request }: Input): Observable<ConnectAppEvent> => {
  const {
    appName,
    requiresDerivation,
    dependencies,
    requireLatestFirmware,
    outdatedApp,
    allowPartialDependencies = false,
  } = request;
  return new Observable(o => {
    const timeoutSub = of({
      type: "unresponsiveDevice",
    })
      .pipe(delay(1000))
      .subscribe(e => o.next(e as ConnectAppEvent));
    const innerSub = ({
      appName,
      dependencies,
      requireLatestFirmware,
    }: ConnectAppRequest): Observable<ConnectAppEvent> =>
      defer(() => from(getAppAndVersion(transport))).pipe(
        concatMap((appAndVersion): Observable<ConnectAppEvent> => {
          timeoutSub.unsubscribe();

          if (isDashboardName(appAndVersion.name)) {
            // check if we meet minimum fw
            if (requireLatestFirmware || outdatedApp) {
              return from(getDeviceInfo(transport)).pipe(
                mergeMap((deviceInfo: DeviceInfo) =>
                  from(getLatestFirmwareForDeviceUseCase(deviceInfo)).pipe(
                    mergeMap((latest: FirmwareUpdateContext | undefined | null) => {
                      const isLatest =
                        !latest || semver.eq(deviceInfo.version, latest.final.version);

                      if (
                        (!requireLatestFirmware || (requireLatestFirmware && isLatest)) &&
                        outdatedApp
                      ) {
                        return from(isUpdateAvailable(deviceInfo, outdatedApp)).pipe(
                          mergeMap(isAvailable =>
                            isAvailable
                              ? throwError(
                                  () =>
                                    new UpdateYourApp(undefined, {
                                      managerAppName: outdatedApp.name,
                                    }),
                                )
                              : throwError(
                                  () =>
                                    new LatestFirmwareVersionRequired(
                                      "LatestFirmwareVersionRequired",
                                      {
                                        latest: latest?.final.version,
                                        current: deviceInfo.version,
                                      },
                                    ),
                                ),
                          ),
                        );
                      }

                      if (isLatest) {
                        o.next({ type: "latest-firmware-resolved" });
                        return innerSub({
                          appName,
                          dependencies,
                          allowPartialDependencies,
                          // requireLatestFirmware // Resolved!.
                        });
                      } else {
                        return throwError(
                          () =>
                            new LatestFirmwareVersionRequired("LatestFirmwareVersionRequired", {
                              latest: latest.final.version,
                              current: deviceInfo.version,
                            }),
                        );
                      }
                    }),
                  ),
                ),
              );
            }
            // check if we meet dependencies
            if (dependencies?.length) {
              const completesInDashboard = isDashboardName(appName);
              return inlineAppInstall({
                transport,
                appNames: [...(completesInDashboard ? [] : [appName]), ...dependencies],
                onSuccessObs: () => {
                  o.next({
                    type: "dependencies-resolved",
                  });
                  return innerSub({
                    appName,
                    allowPartialDependencies,
                    // dependencies // Resolved!
                  });
                },
                allowPartialDependencies,
              });
            }

            // maybe we want to be in the dashboard
            if (appName === appAndVersion.name) {
              const e: ConnectAppEvent = {
                type: "opened",
                app: appAndVersion,
              };
              return of(e);
            }

            // we're in dashboard
            return openAppFromDashboard(transport, appName);
          }

          const appNeedsUpgrade = mustUpgrade(appAndVersion.name, appAndVersion.version);
          if (appNeedsUpgrade) {
            // quit app, check provider's app update for device's minimum requirements.
            o.next({
              type: "has-outdated-app",
              outdatedApp: appAndVersion,
            });
          }

          // need dashboard to check firmware, install dependencies, or verify app update
          if (
            dependencies?.length ||
            requireLatestFirmware ||
            appAndVersion.name !== appName ||
            appNeedsUpgrade
          ) {
            return attemptToQuitApp(transport, appAndVersion as AppAndVersion);
          }

          if (requiresDerivation) {
            return derivationLogic(transport, {
              requiresDerivation,
              appAndVersion: appAndVersion as AppAndVersion,
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
        catchError((e: unknown) => {
          if (
            (typeof e === "object" &&
              e !== null &&
              "_tag" in e &&
              e._tag === "DeviceDisconnectedWhileSendingError") ||
            e instanceof DisconnectedDeviceDuringOperation ||
            e instanceof DisconnectedDevice
          ) {
            return of(<ConnectAppEvent>{
              type: "disconnected",
            });
          }

          if (e && e instanceof TransportStatusError) {
            switch (e.statusCode) {
              case StatusCodes.CLA_NOT_SUPPORTED: // in 1.3.1 dashboard
              case StatusCodes.INS_NOT_SUPPORTED: // in 1.3.1 and bitcoin app
                // fallback on "old way" because device does not support getAppAndVersion
                if (!requiresDerivation) {
                  // if there is no derivation, there is nothing we can do to check an app (e.g. requiring non coin app)
                  return throwError(() => new FirmwareOrAppUpdateRequired());
                }

                return derivationLogic(transport, {
                  requiresDerivation,
                  appName,
                });
            }
          } else if (e instanceof LockedDeviceError) {
            return of({
              type: "lockedDevice",
            } as ConnectAppEvent);
          }

          return throwError(() => e);
        }),
      );

    const sub = innerSub({
      appName,
      dependencies,
      requireLatestFirmware,
      allowPartialDependencies,
    }).subscribe(o);

    return () => {
      timeoutSub.unsubscribe();
      sub.unsubscribe();
    };
  });
};

const isDmkTransport = (
  transport: Transport,
): transport is Transport & { dmk: DeviceManagementKit; sessionId: string } => {
  return (
    "dmk" in transport &&
    transport.dmk !== undefined &&
    "sessionId" in transport &&
    transport.sessionId !== undefined
  );
};

const appNameToDependency = (appName: string): ApplicationDependency => {
  const constraints = Object.values(DeviceModelId).reduce<ApplicationConstraint[]>(
    (result, model) => {
      const minVersion = getMinVersion(appName, model);
      if (minVersion) {
        result.push({
          minVersion: minVersion as ApplicationVersionConstraint,
          applicableModels: [model],
        });
      }
      return result;
    },
    [],
  );
  return {
    name: appName,
    constraints,
  };
};

export default function connectAppFactory(
  {
    isLdmkConnectAppEnabled,
  }: {
    isLdmkConnectAppEnabled: boolean;
  } = { isLdmkConnectAppEnabled: false },
) {
  if (!isLdmkConnectAppEnabled) {
    return ({ deviceId, request }: Input): Observable<ConnectAppEvent> =>
      withDevice(deviceId)(transport => cmd(transport, { deviceId, request }));
  }
  return ({ deviceId, request }: Input): Observable<ConnectAppEvent> => {
    const {
      appName,
      requiresDerivation,
      dependencies,
      requireLatestFirmware,
      allowPartialDependencies = false,
    } = request;
    return withDevice(deviceId)(transport => {
      if (!isDmkTransport(transport)) {
        return cmd(transport, { deviceId, request });
      }
      const { dmk, sessionId } = transport;
      const deviceAction = new ConnectAppDeviceAction({
        input: {
          application: appNameToDependency(appName),
          dependencies: dependencies ? dependencies.map(name => ({ name })) : [],
          requireLatestFirmware,
          allowMissingApplication: allowPartialDependencies,
          unlockTimeout: 0, // Expect to fail immediately when device is locked
          requiredDerivation: requiresDerivation
            ? async () => {
                const { currencyId, ...derivationRest } = requiresDerivation;
                const derivation = await getAddress(transport, {
                  currency: getCryptoCurrencyById(currencyId),
                  ...derivationRest,
                });
                return derivation.address;
              }
            : undefined,
        },
      });
      const observable = dmk.executeDeviceAction({
        sessionId,
        deviceAction,
      });
      return new ConnectAppEventMapper(dmk, sessionId, appName, observable).map();
    });
  };
}
