import Transport from "@ledgerhq/hw-transport";
import { StatusCodes, UserRefusedDeviceNameChange } from "@ledgerhq/errors";

/**
 * Specify a new name for a device. This is technically supported on all models
 * but only allowed on LNX and Stax currently. There are some FW version based
 * limitations on the max length to account for but these are enforced at the
 * command user level.
 */
export default async (transport: Transport, name: string): Promise<void> => {
  await transport.send(0xe0, 0xd4, 0x00, 0x00, Buffer.from(name)).catch((e) => {
    if (
      e.statusCode === StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED ||
      e.statusCode === StatusCodes.USER_REFUSED_ON_DEVICE
    ) {
      throw new UserRefusedDeviceNameChange();
    }

    throw e;
  });
};
