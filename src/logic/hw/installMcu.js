// @flow
import type Transport from "@ledgerhq/hw-transport";
import ManagerAPI from "../../api/Manager";
import getDeviceInfo from "./getDeviceInfo";

export default async (transport: Transport<*>): Promise<void> => {
  const { seVersion, targetId } = await getDeviceInfo(transport);
  const nextVersion = await ManagerAPI.getNextMCU(seVersion);
  await ManagerAPI.installMcu(transport, "mcu", {
    targetId,
    version: nextVersion.name,
  }).toPromise();
};
