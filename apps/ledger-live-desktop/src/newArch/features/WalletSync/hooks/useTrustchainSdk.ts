import os from "os";
import { from, lastValueFrom } from "rxjs";
import { useMemo } from "react";
import { getEnv } from "@ledgerhq/live-env";
import { getSdk } from "@ledgerhq/trustchain/index";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import Transport from "@ledgerhq/hw-transport";
import { trustchainLifecycle } from "@ledgerhq/live-wallet/walletsync/index";
import { useStore } from "react-redux";
import { walletSelector } from "~/renderer/reducers/wallet";
import { walletSyncStateSelector } from "@ledgerhq/live-wallet/store";
import { TrustchainSDK } from "@ledgerhq/trustchain/types";

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

let sdkInstance: TrustchainSDK | null = null;

export function useTrustchainSdk() {
  const isMockEnv = !!getEnv("MOCK");
  const defaultContext = useMemo(() => {
    const applicationId = 16;
    const platform = os.platform();
    const hash = getEnv("USER_ID").slice(0, 5);
    const name = `${platformMap[platform] || platform}${hash ? " " + hash : ""}`;
    return { applicationId, name };
  }, []);
  const store = useStore();
  const lifecycle = useMemo(
    () =>
      trustchainLifecycle({
        getCurrentWSState: () => walletSyncStateSelector(walletSelector(store.getState())),
      }),
    [store],
  );

  if (sdkInstance === null) {
    sdkInstance = getSdk(isMockEnv, defaultContext, lifecycle);
  }

  return sdkInstance;
}
