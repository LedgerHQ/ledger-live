// @flow
/* eslint-disable no-bitwise */

import type Transport from "@ledgerhq/hw-transport";
import Config from "react-native-config";
import getFirmwareInfo from "./getFirmwareInfo";
import type { DeviceInfo } from "../../types/manager";

const PROVIDERS = {
  "": 1,
  das: 2,
  club: 3,
  shitcoins: 4,
  ee: 5,
};

export default async (transport: Transport<*>): Promise<DeviceInfo> => {
  const res = await getFirmwareInfo(transport);
  const { seVersion } = res;
  const { targetId, mcuVersion, flags } = res;
  const parsedVersion =
    seVersion.match(/([0-9]+.[0-9])+(.[0-9]+)?((?!-osu)-([a-z]+))?(-osu)?/) ||
    [];
  const isOSU = typeof parsedVersion[5] !== "undefined";
  const providerName = parsedVersion[4] || "";
  const providerId = Config.FORCE_PROVIDER || PROVIDERS[providerName];
  const isBootloader = (targetId & 0xf0000000) !== 0x30000000;
  const majMin = parsedVersion[1];
  const patch = parsedVersion[2] || ".0";
  const fullVersion =
    targetId === 0x33000004
      ? "1.0"
      : `${majMin}${patch}${providerName ? `-${providerName}` : ""}`;
  return {
    targetId,
    seVersion: majMin + patch,
    isOSU,
    mcuVersion,
    isBootloader,
    providerName,
    providerId,
    flags,
    fullVersion,
  };
};
