// @flow
import type Transport from "@ledgerhq/hw-transport";
import type { Firmware } from "../../types/manager";
import ManagerAPI from "../../api/Manager";

export default async (
  transport: Transport<*>,
  targetId: string | number,
  firmware: Firmware,
): Promise<void> => {
  try {
    const params = {
      targetId,
      ...firmware,
      firmwareKey: firmware.firmware_key,
    };
    delete params.shouldFlashMcu;
    await ManagerAPI.install(transport, "firmware", params).toPromise();
  } catch (error) {
    throw error;
  }
};
