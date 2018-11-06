// @flow
import type Transport from "@ledgerhq/hw-transport";
import getFirmwareInfo from "./getFirmwareInfo";

export default async (transport: Transport<*>): Promise<boolean> => {
  const { targetId, seVersion } = await getFirmwareInfo(transport);
  if (targetId && seVersion) {
    return true;
  }
  return false;
};
