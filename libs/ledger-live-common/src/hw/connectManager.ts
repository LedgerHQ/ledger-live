import { Observable, concat, concatWith, from, of, throwError } from "rxjs";
import { concatMap, catchError, delay } from "rxjs/operators";
import {
  TransportStatusError,
  DeviceOnDashboardExpected,
  StatusCodes,
  LockedDeviceError,
} from "@ledgerhq/errors";
import { isCharonSupported } from "@ledgerhq/device-core";
import { identifyTargetId } from "@ledgerhq/devices";
import { DeviceInfo } from "@ledgerhq/types-live";
import type Transport from "@ledgerhq/hw-transport";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { PrepareConnectManagerDeviceAction } from "@ledgerhq/live-dmk-shared";
import type { ListAppsEvent } from "../apps";
import { listAppsUseCase } from "../device/use-cases/listAppsUseCase";
import { withDevice } from "./deviceAccess";
import getDeviceInfo from "./getDeviceInfo";
import getAppAndVersion from "./getAppAndVersion";
import { isDashboardName } from "./isDashboardName";
import { DeviceNotOnboarded } from "../errors";
import attemptToQuitApp, { AttemptToQuitAppEvent } from "./attemptToQuitApp";
import { LockedDeviceEvent } from "./actions/types";
import { ManagerRequest } from "./actions/manager";
import { PrepareConnectManagerEventMapper } from "./connectManagerEventMapper";
import { extractOnboardingState, OnboardingStep } from "./extractOnboardingState";

export type Input = {
  deviceId: string;
  deviceName: string | null;
  request: ManagerRequest | null | undefined;
};

export type ConnectManagerEvent =
  | AttemptToQuitAppEvent
  | {
      type: "osu";
      deviceInfo: DeviceInfo;
    }
  | {
      type: "bootloader";
      deviceInfo: DeviceInfo;
    }
  | {
      type: "listingApps";
      deviceInfo: DeviceInfo;
    }
  | ListAppsEvent
  | LockedDeviceEvent;

const cmd = (transport: Transport, { request }: Input): Observable<ConnectManagerEvent> =>
  new Observable(o => {
    const timeoutSub = of({
      type: "unresponsiveDevice",
    } as ConnectManagerEvent)
      .pipe(delay(1000))
      .subscribe(e => o.next(e));

    const sub = from(getDeviceInfo(transport))
      .pipe(
        concatMap(deviceInfo => {
          timeoutSub.unsubscribe();

          if (!deviceInfo.onboarded && !deviceInfo.isRecoveryMode) {
            throw new DeviceNotOnboarded();
          }

          if (deviceInfo.isBootloader) {
            return of({
              type: "bootloader",
              deviceInfo,
            } as ConnectManagerEvent);
          }

          if (deviceInfo.isOSU) {
            return of({
              type: "osu",
              deviceInfo,
            } as ConnectManagerEvent);
          }

          if (
            isCharonSupported(
              deviceInfo.seVersion ?? "",
              identifyTargetId(deviceInfo.seTargetId ?? 0)?.id,
            )
          ) {
            const onboardingState = extractOnboardingState(
              deviceInfo.seFlags,
              deviceInfo.charonState,
            );
            if (onboardingState.currentOnboardingStep === OnboardingStep.BackupCharon) {
              throw new DeviceNotOnboarded();
            }
          }

          return concat(
            of({
              type: "listingApps",
              deviceInfo,
            } as ConnectManagerEvent),
            listAppsUseCase(transport, deviceInfo),
          );
        }),
        catchError((e: unknown) => {
          if (e instanceof LockedDeviceError) {
            return of({
              type: "lockedDevice",
            } as ConnectManagerEvent);
          } else if (
            e instanceof DeviceOnDashboardExpected ||
            (e &&
              e instanceof TransportStatusError &&
              [
                StatusCodes.CLA_NOT_SUPPORTED,
                StatusCodes.INS_NOT_SUPPORTED,
                StatusCodes.UNKNOWN_APDU,
                0x6e01, // No StatusCodes definition
                0x6d01, // No StatusCodes definition
              ].includes(e.statusCode))
          ) {
            return from(getAppAndVersion(transport)).pipe(
              concatMap(appAndVersion => {
                return !request?.autoQuitAppDisabled && !isDashboardName(appAndVersion.name)
                  ? attemptToQuitApp(transport, appAndVersion)
                  : of({
                      type: "appDetected",
                    } as ConnectManagerEvent);
              }),
            );
          }

          return throwError(() => e);
        }),
      )
      .subscribe(o);

    return () => {
      timeoutSub.unsubscribe();
      sub.unsubscribe();
    };
  });

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

export default function connectManagerFactory(
  {
    isLdmkConnectAppEnabled,
  }: {
    isLdmkConnectAppEnabled: boolean;
  } = { isLdmkConnectAppEnabled: false },
) {
  if (!isLdmkConnectAppEnabled) {
    return ({ deviceId, deviceName, request }: Input): Observable<ConnectManagerEvent> =>
      withDevice(
        deviceId,
        deviceName ? { matchDeviceByName: deviceName } : undefined,
      )(transport => cmd(transport, { deviceId, deviceName, request }));
  }
  return ({ deviceId, deviceName, request }: Input): Observable<ConnectManagerEvent> =>
    withDevice(
      deviceId,
      deviceName ? { matchDeviceByName: deviceName } : undefined,
    )(transport => {
      if (!isDmkTransport(transport)) {
        return cmd(transport, { deviceId, deviceName, request });
      }
      const { dmk, sessionId } = transport;
      const deviceAction = new PrepareConnectManagerDeviceAction({
        input: {
          unlockTimeout: 0, // Expect to fail immediately when device is locked
        },
      });
      const observable = dmk.executeDeviceAction({
        sessionId,
        deviceAction,
      });
      return new PrepareConnectManagerEventMapper(observable)
        .map()
        .pipe(concatWith(cmd(transport, { deviceId, deviceName, request })));
    });
}
