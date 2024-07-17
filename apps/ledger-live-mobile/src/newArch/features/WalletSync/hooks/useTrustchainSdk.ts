import { firstValueFrom, from, lastValueFrom } from "rxjs";
import { useMemo } from "react";
import { getEnv } from "@ledgerhq/live-env";
import { getSdk } from "@ledgerhq/trustchain/index";
import Transport from "@ledgerhq/hw-transport";
import { Platform } from "react-native";
import { useDevice } from "./useDevice";
import { withDevice, withDevicePolling } from "@ledgerhq/live-common/hw/deviceAccess";
import { CantOpenDevice } from "@ledgerhq/errors";

export function runWithDevice<T>(
  deviceId: string,
  fn: (transport: Transport) => Promise<T>,
): Promise<T> {
  return firstValueFrom(
    withDevicePolling(deviceId)(
      transport => from(fn(transport)),
      e => e instanceof CantOpenDevice,
    ),
  );
}

export function useTrustchainSdk() {
  const isMockEnv = !!getEnv("MOCK");

  const { device } = useDevice();
  const defaultContext = useMemo(() => {
    const applicationId = 16;
    const platform = Platform.OS;
    const hash = getEnv("USER_ID").slice(0, 5);

    const name = `${device || platform}${hash ? " " + hash : ""}`;
    return { applicationId, name };
  }, [device]);

  const sdk = getSdk(isMockEnv, defaultContext);

  return sdk;
}
