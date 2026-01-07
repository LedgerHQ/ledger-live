import { Device } from "@ledgerhq/live-common/hw/actions/types";
import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getAppAndVersion from "@ledgerhq/live-common/hw/getAppAndVersion";
import { useEffect, useState } from "react";
import { defer, from, repeat, catchError, map, Observable, of } from "rxjs";
import { DeviceModelId } from "@ledgerhq/devices/index";
import { SendApduTimeoutError } from "@ledgerhq/device-management-kit";
import { IsDeviceLockedResult, IsDeviceLockedResultType } from "./types";

type Params = {
  device: Device | null;
  enabled: boolean;
};

export function isLockedDevicePolling(
  device: Device,
  transport: Transport,
  getAppAndVersionFn: typeof getAppAndVersion,
  pollingPeriodMs: number,
): Observable<IsDeviceLockedResult> {
  /**
   * This implementation is done with legacy logic as not all transports (e.g proxy) are yet migrated to the DMK.
   */
  return defer(() =>
    from(
      getAppAndVersionFn(
        transport,
        device.modelId === DeviceModelId.nanoS ? { abortTimeoutMs: pollingPeriodMs / 2 } : {},
      ),
    ).pipe(
      map<unknown, IsDeviceLockedResult>(() => ({ type: IsDeviceLockedResultType.unlocked })),
      catchError((error: Error) => {
        if (
          error instanceof TransportStatusError &&
          [StatusCodes.CLA_NOT_SUPPORTED, StatusCodes.INS_NOT_SUPPORTED].includes(error.statusCode)
        ) {
          return of<IsDeviceLockedResult>({
            type: IsDeviceLockedResultType.lockedStateCannotBeDetermined,
          });
        }

        if (error instanceof SendApduTimeoutError) {
          return of<IsDeviceLockedResult>({ type: IsDeviceLockedResultType.locked });
        }

        if (
          error instanceof TransportStatusError &&
          error.statusCode === StatusCodes.LOCKED_DEVICE
        ) {
          return of<IsDeviceLockedResult>({ type: IsDeviceLockedResultType.locked });
        }

        return of<IsDeviceLockedResult>({ type: IsDeviceLockedResultType.error, error });
      }),
    ),
  ).pipe(
    repeat({
      delay: pollingPeriodMs,
    }),
  );
}

export function useIsDeviceLockedPolling({ device, enabled }: Params): IsDeviceLockedResult {
  const [result, setResult] = useState<IsDeviceLockedResult>({
    type: IsDeviceLockedResultType.undetermined,
  });

  useEffect(() => {
    if (!enabled || !device) return;
    const sub = withDevice(device.deviceId)(transport =>
      isLockedDevicePolling(device, transport, getAppAndVersion, 1000),
    ).subscribe({
      next: res => {
        setResult(res);
      },
    });

    return () => {
      sub.unsubscribe();
      setResult({ type: IsDeviceLockedResultType.undetermined });
    };
  }, [enabled, device]);

  return result;
}
