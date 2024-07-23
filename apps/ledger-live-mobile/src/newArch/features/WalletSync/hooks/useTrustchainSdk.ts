import { firstValueFrom, from } from "rxjs";
import { useMemo } from "react";
import { getEnv } from "@ledgerhq/live-env";
import { getSdk } from "@ledgerhq/trustchain/index";
import Transport from "@ledgerhq/hw-transport";
import { Platform } from "react-native";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";

export function runWithDevice<T>(
  deviceId: string,
  fn: (transport: Transport) => Promise<T>,
): Promise<T> {
  return firstValueFrom(withDevice(deviceId)(transport => from(fn(transport))));
}

const platformMap: Record<string, string | undefined> = {
  ios: "iOS",
  android: "Android",
};

export function useTrustchainSdk() {
  const isMockEnv = !!getEnv("MOCK");

  const defaultContext = useMemo(() => {
    const applicationId = 16;
    const hash = getEnv("USER_ID").slice(0, 5);

    const name = `${platformMap[Platform.OS] ?? Platform.OS} ${Platform.Version} ${hash ? " " + hash : ""}`;

    return { applicationId, name };
  }, []);

  const sdk = useMemo(() => getSdk(isMockEnv, defaultContext), [isMockEnv, defaultContext]);

  return sdk;
}
