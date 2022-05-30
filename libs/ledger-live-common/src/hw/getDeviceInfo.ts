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
import { DeviceNotOnboarded } from "../errors";
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

  const res = await getVersion(transport).catch((e) => {
    if (e instanceof TransportStatusError) {
      // @ts-expect-error typescript not checking agains the instanceof
      if (e.statusCode === 0x6d06) {
        throw new DeviceNotOnboarded();
      }
    }
    throw e;
  });

  const {
    isBootloader,
    rawVersion,
    targetId,
    seVersion,
    seTargetId,
    mcuBlVersion,
    mcuVersion,
    mcuTargetId,
    flags,
    bootloaderVersion,
    hardwareVersion,
    languageId,
  } = res;
  const isOSU = rawVersion.includes("-osu");
  const version = rawVersion.replace("-osu", "");
  const m = rawVersion.match(/([0-9]+.[0-9]+)(.[0-9]+)?(-(.*))?/);
  const [, majMin, , , postDash] = m || [];
  const providerName = PROVIDERS[postDash] ? postDash : null;
  const flag = flags.length > 0 ? flags[0] : 0;
  const managerAllowed = !!(flag & ManagerAllowedFlag);
  const pinValidated = !!(flag & PinValidatedFlag);

  let isRecoveryMode = false;
  let onboarded = true;
  if (flags.length === 4) {
    // Nb Since LNS+ unseeded devices are visible + extra flags
    isRecoveryMode = !!(flags[0] & 0x01);
    onboarded = !!(flags[0] & 0x04);
  }

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
    seVersion,
    mcuBlVersion,
    majMin,
    providerName: providerName || null,
    targetId,
    seTargetId,
    mcuTargetId,
    isOSU,
    isBootloader,
    isRecoveryMode,
    managerAllowed,
    pinValidated,
    onboarded,
    bootloaderVersion,
    hardwareVersion,
    languageId,
  };
}
