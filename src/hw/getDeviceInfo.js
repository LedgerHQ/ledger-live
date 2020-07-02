// @flow
/* eslint-disable no-bitwise */

import { log } from "@ledgerhq/logs";
import type Transport from "@ledgerhq/hw-transport";
import getVersion from "./getVersion";
import type { DeviceInfo } from "../types/manager";
import { PROVIDERS } from "../manager/provider";

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
  const [, majMin, , , postDash] = m || [];
  const providerName = PROVIDERS[postDash] ? postDash : null;
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
    providerName: providerName || null,
    targetId,
    isOSU,
    isBootloader,
    managerAllowed,
    pinValidated,
  };
}
