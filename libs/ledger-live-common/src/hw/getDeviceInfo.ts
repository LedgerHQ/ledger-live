/* eslint-disable no-bitwise */
import { DeviceOnDashboardExpected, TransportStatusError } from "@ledgerhq/errors";
import { LocalTracer, log } from "@ledgerhq/logs";
import Transport from "@ledgerhq/hw-transport";
import { getVersion } from "../device/use-cases/getVersionUseCase";
import isDevFirmware from "./isDevFirmware";
import getAppAndVersion from "./getAppAndVersion";
import { PROVIDERS } from "../manager/provider";
import { isDashboardName } from "./isDashboardName";
import { DeviceNotOnboarded } from "../errors";
import type { DeviceInfo } from "@ledgerhq/types-live";

const ManagerAllowedFlag = 0x08;
const PinValidatedFlag = 0x80;

export default async function (transport: Transport): Promise<DeviceInfo> {
  const tracer = new LocalTracer("hw", {
    ...transport.getTraceContext(),
    function: "getDeviceInfo",
  });
  tracer.trace("Starting get device info");

  const probablyOnDashboard = await getAppAndVersion(transport)
    .then(({ name }) => isDashboardName(name))
    .catch(e => {
      tracer.trace(`Error from getAppAndVersion: ${e}`, { error: e });
      if (e instanceof TransportStatusError) {
        if (e.statusCode === 0x6e00) {
          return true;
        }

        if (e.statusCode === 0x6d00) {
          return false;
        }
      }

      throw e;
    });

  if (!probablyOnDashboard) {
    tracer.trace(`Device not on dashboard`);
    throw new DeviceOnDashboardExpected();
  }

  const res = await getVersion(transport).catch(e => {
    tracer.trace(`Error from getVersion: ${e}`, { error: e });
    if (e instanceof TransportStatusError) {
      if (e.statusCode === 0x6d06 || e.statusCode === 0x6d07) {
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
    bootloaderVersion,
    hardwareVersion,
    languageId,
    charonState,
    flags,
  } = res;
  const isOSU = rawVersion.includes("-osu");
  const version = rawVersion.replace("-osu", "");
  const m = rawVersion.match(/([0-9]+.[0-9]+(.[0-9]+){0,1})?(-(.*))?/);
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
      (isOSU ? " (osu)" : isBootloader ? " (bootloader)" : ""),
  );

  const hasDevFirmware = isDevFirmware(seVersion);

  return {
    version,
    mcuVersion,
    seVersion,
    mcuBlVersion,
    majMin,
    providerName: providerName || null,
    targetId,
    hasDevFirmware,
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
    charonState,
    seFlags: flags,
  };
}
