// @flow
/* eslint-disable no-bitwise */

import { log } from "@ledgerhq/logs";
import type Transport from "@ledgerhq/hw-transport";
import getVersion from "./getVersion";
import type { DeviceInfo } from "../types/manager";
import { getEnv } from "../env";

const PROVIDERS: { [_: string]: number } = {
  "": 1,
  das: 2,
  club: 3,
  shitcoins: 4,
  ee: 5,
};

const ManagerAllowedFlag = 0x08;
const PinValidatedFlag = 0x80;

export default async function getDeviceInfo(
  transport: Transport<*>
): Promise<DeviceInfo> {
  const res = await getVersion(transport);
  const { seVersion } = res;
  const { targetId, mcuVersion, flags } = res;
  const isOSU = seVersion.includes("-osu");
  const version = seVersion.replace("-osu", "");
  const m = seVersion.match(/([0-9]+.[0-9]+)(.[0-9]+)?(-(.*))?/);
  const [, majMin, , , providerName] = m || [];
  const forceProvider = getEnv("FORCE_PROVIDER");
  const providerId =
    forceProvider && forceProvider !== 1
      ? forceProvider
      : PROVIDERS[providerName] || 1;
  const isBootloader = (targetId & 0xf0000000) !== 0x30000000;
  const flag = flags.length > 0 ? flags[0] : 0;
  const managerAllowed = !!(flag & ManagerAllowedFlag);
  const pinValidated = !!(flag & PinValidatedFlag);
  log(
    "hw",
    "deviceInfo: se@" +
      version +
      " mcu@" +
      mcuVersion +
      (isOSU ? " (osu)" : isBootloader ? " (bootloader)" : "")
  );
  return {
    version,
    mcuVersion,
    majMin,
    providerId,
    targetId,
    isOSU,
    isBootloader,
    managerAllowed,
    pinValidated,
  };
}
