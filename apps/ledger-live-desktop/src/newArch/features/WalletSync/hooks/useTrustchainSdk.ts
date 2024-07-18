import os from "os";
import { from, lastValueFrom } from "rxjs";
import { useMemo } from "react";
import { getEnv } from "@ledgerhq/live-env";
import { getSdk } from "@ledgerhq/trustchain/index";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import Transport from "@ledgerhq/hw-transport";

export function runWithDevice<T>(
  deviceId: string | undefined,
  fn: (transport: Transport) => Promise<T>,
): Promise<T> {
  return lastValueFrom(withDevice(deviceId || "")(transport => from(fn(transport))));
}

const platformMap: Record<string, string | undefined> = {
  darwin: "Mac",
  win32: "Windows",
  linux: "Linux",
};

export function useTrustchainSdk() {
  const isMockEnv = !!getEnv("MOCK");
  const defaultContext = useMemo(() => {
    const applicationId = 16;
    const platform = os.platform();
    const hash = getEnv("USER_ID").slice(0, 5);
    const name = `${platformMap[platform] || platform}${hash ? " " + hash : ""}`;
    return { applicationId, name };
  }, []);
  const sdk = getSdk(isMockEnv, defaultContext);

  return sdk;
}
