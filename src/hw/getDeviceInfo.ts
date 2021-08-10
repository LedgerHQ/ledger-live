/* eslint-disable no-bitwise */
import {
  DeviceOnDashboardExpected,
  TransportStatusError,
} from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import Transport from "@ledgerhq/hw-transport";
import getVersion from "./getVersion";
import getAppAndVersion from "./getAppAndVersion";
import type { DeviceInfo } from "../types/manager";
import { PROVIDERS } from "../manager/provider";
import { isDashboardName } from "./isDashboardName";
const ManagerAllowedFlag = 0x08;
const PinValidatedFlag = 0x80;
export default async function getDeviceInfo(
  transport: Transport
): Promise<DeviceInfo> {
  const probablyOnDashboard = await getAppAndVersion(transport)
    .then(({ name }) => isDashboardName(name))
    .catch((e) => {
      if (e instanceof TransportStatusError) {
        // @ts-expect-error typescript not checking agains the instanceof
        if (e.statusCode === 0x6e00) {
          return true;
        }

        // @ts-expect-error typescript not checking agains the instanceof
        if (e.statusCode === 0x6d00) {
          return false;
        }
      }

      throw e;
    });

  if (!probablyOnDashboard) {
    throw new DeviceOnDashboardExpected();
  }

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
