import { DeviceModelId } from "@ledgerhq/devices";
import Transport from "@ledgerhq/hw-transport";
import { FirmwareInfo } from "../types/manager";
import { satisfies as versionSatisfies } from "semver";

const deviceVersionRangesForBootloaderVersion: { [key in DeviceModelId]?: string } = {
  nanoS: ">=2.0.0",
  nanoX: ">=2.0.0 || 2.1.0-lo2", // TODO: remove pre-release version
  nanoSP: ">=1.0.0",
};
export const isBootloaderVersionSupported = (seVersion: string, modelId: DeviceModelId) =>
  deviceVersionRangesForBootloaderVersion[modelId] &&
  versionSatisfies(seVersion, deviceVersionRangesForBootloaderVersion[modelId] as string);

const deviceVersionRangesForHardwareVersion: { [key in DeviceModelId]?: string } = {
  nanoX: ">=2.0.0 || 2.1.0-lo2", // TODO: remove pre-release version
};
export const isHardwareVersionSupported = (seVersion: string, modelId: DeviceModelId) =>
  deviceVersionRangesForHardwareVersion[modelId] &&
  versionSatisfies(seVersion, deviceVersionRangesForHardwareVersion[modelId] as string);

// TODO: To be replaced by actual release version with the localization firmware for each device
const deviceVersionRangesForLanguageId: { [key in DeviceModelId]?: string } = {
  nanoX: "=2.1.0-lo2",
};
export const isLanguageIdSupported = (seVersion: string, modelId: DeviceModelId) =>
  deviceVersionRangesForLanguageId[modelId] &&
  versionSatisfies(seVersion, deviceVersionRangesForLanguageId[modelId] as string);

/**
 * Retrieve targetId and firmware version from device
 */

const deviceTargetIds = {
  "33000004": DeviceModelId.nanoX,
  "31100004": DeviceModelId.nanoS,
  "33100004": DeviceModelId.nanoSP,
  "33200004": DeviceModelId.nanoFTS,
};

export default async function getVersion(transport: Transport): Promise<FirmwareInfo> {
  const res = await transport.send(0xe0, 0x01, 0x00, 0x00);
  const data = res.slice(0, res.length - 2);
  let i = 0;

  // parse the target id of either BL or SE
  const targetId = data.readUIntBE(0, 4);
  i += 4;

  // parse the version of either BL or SE
  const rawVersionLength = data[i++];
  let rawVersion = data.slice(i, i + rawVersionLength).toString();
  i += rawVersionLength;

  // flags. gives information about manager allowed in SE mode.
  const flagsLength = data[i++];
  let flags = data.slice(i, i + flagsLength);
  i += flagsLength;

  if (!rawVersionLength) {
    // To support old firmware like bootloader of 1.3.1
    rawVersion = "0.0.0";
    flags = Buffer.allocUnsafeSlow(0);
  }

  let mcuVersion = "";
  let mcuBlVersion: string | undefined;
  let seVersion: string | undefined;
  let bootloaderVersion: string | undefined;
  let hardwareVersion: number | undefined;
  let mcuTargetId: number | undefined;
  let seTargetId: number | undefined;
  let languageId: number | undefined;

  const isBootloader = (targetId & 0xf0000000) !== 0x30000000;

  if (isBootloader) {
    mcuBlVersion = rawVersion;
    mcuTargetId = targetId;

    if (i < data.length) {
      // se part 1
      const part1Length = data[i++];
      const part1 = data.slice(i, i + part1Length);
      i += part1Length;

      // at this time, this is how we branch old & new format
      if (part1Length >= 5) {
        seVersion = part1.toString();
        // se part 2
        const part2Length = data[i++];
        const part2 = data.slice(i, i + part2Length);
        i += flagsLength;
        seTargetId = part2.readUIntBE(0, 4);
      } else {
        seTargetId = part1.readUIntBE(0, 4);
      }
    }
  } else {
    seVersion = rawVersion;
    seTargetId = targetId;

    // if SE: mcu version
    const mcuVersionLength = data[i++];
    let mcuVersionBuf: Buffer = Buffer.from(data.slice(i, i + mcuVersionLength));
    i += mcuVersionLength;

    if (mcuVersionBuf[mcuVersionBuf.length - 1] === 0) {
      mcuVersionBuf = mcuVersionBuf.slice(0, mcuVersionBuf.length - 1);
    }
    mcuVersion = mcuVersionBuf.toString();

    const isOSU = rawVersion.includes("-osu");

    if (!isOSU) {
      const deviceModel: DeviceModelId = deviceTargetIds[targetId.toString(16)];

      if (isBootloaderVersionSupported(seVersion, deviceModel)) {
        const bootloaderVersionLength = data[i++];
        let bootloaderVersionBuf: Buffer = Buffer.from(data.slice(i, i + bootloaderVersionLength));
        i += bootloaderVersionLength;

        if (bootloaderVersionBuf[bootloaderVersionBuf.length - 1] === 0) {
          bootloaderVersionBuf = bootloaderVersionBuf.slice(0, bootloaderVersionBuf.length - 1);
        }
        bootloaderVersion = bootloaderVersionBuf.toString();
      }

      if (isHardwareVersionSupported(seVersion, deviceModel)) {
        const hardwareVersionLength = data[i++];
        hardwareVersion = data.slice(i, i + hardwareVersionLength).readUIntBE(0, 1); // ?? string? number?
        i += hardwareVersionLength;
      }

      if (isLanguageIdSupported(seVersion, deviceModel)) {
        const languageIdLength = data[i++];
        languageId = data.slice(i, i + languageIdLength).readUIntBE(0, 1);
      }
    }
  }

  return {
    isBootloader,
    rawVersion,
    targetId,
    seVersion,
    mcuVersion,
    mcuBlVersion,
    mcuTargetId,
    seTargetId,
    flags,
    bootloaderVersion,
    hardwareVersion,
    languageId,
  };
}
