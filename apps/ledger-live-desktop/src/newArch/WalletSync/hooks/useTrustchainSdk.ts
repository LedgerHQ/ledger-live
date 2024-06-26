import { getEnv } from "@ledgerhq/live-env";
import { getSdk } from "@ledgerhq/trustchain/index";

import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { from, lastValueFrom } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { randomUUID } from "crypto";

export function runWithDevice<T>(
  deviceId: string | undefined,
  fn: (transport: Transport) => Promise<T>,
): Promise<T> {
  return lastValueFrom(withDevice(deviceId || "")(transport => from(fn(transport))));
}

const defaultContext = { applicationId: 16, name: `LLD Sync ${randomUUID().slice(0, 8)}` }; // TODO : get name dynamically depending on the platform

export function useTrustchainSdk() {
  const isMockEnv = !!getEnv("MOCK");
  const sdk = getSdk(isMockEnv, defaultContext);

  return sdk;
}
