// @flow
/* eslint-disable no-bitwise */

import type Transport from "@ledgerhq/hw-transport";
import getFirmwareInfo from "./getFirmwareInfo";
import type { DeviceInfo } from "../types/manager";
import { getEnv } from "../env";

const PROVIDERS: { [_: string]: number } = {
  "": 1,
  das: 2,
  club: 3,
  shitcoins: 4,
  ee: 5
};

const ManagerAllowedFlag = 0x08;
const PinValidatedFlag = 0x80;

export default async (transport: Transport<*>): Promise<DeviceInfo> => {
  const res = await getFirmwareInfo(transport);
  const { seVersion } = res;
  const { targetId, mcuVersion, flags } = res;
  const parsedVersion =
    seVersion.match(/([0-9]+.[0-9])+(.[0-9]+)?((?!-osu)-([a-z]+))?(-osu)?/) ||
    [];
  const isOSU = typeof parsedVersion[5] !== "undefined";
  const providerName = parsedVersion[4] || "";
  const providerId = getEnv("FORCE_PROVIDER") || PROVIDERS[providerName];
  const isBootloader = (targetId & 0xf0000000) !== 0x30000000;
  const majMin = parsedVersion[1];
  const patch = parsedVersion[2] || ".0";
  const fullVersion = `${majMin}${patch}${
    providerName ? `-${providerName}` : ""
  }`;
  const flag = flags.length > 0 ? flags[0] : 0;
  const managerAllowed = !!(flag & ManagerAllowedFlag);
  const pinValidated = !!(flag & PinValidatedFlag);
  return {
    targetId,
    seVersion: majMin + patch,
    rawVersion: majMin,
    isOSU,
    mcuVersion,
    isBootloader,
    providerName,
    providerId,
    flags,
    managerAllowed,
    pinValidated,
    fullVersion
  };
};
