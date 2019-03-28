// @flow
import Transport from "@ledgerhq/hw-transport";
import { StatusCodes, UserRefusedDeviceNameChange } from "@ledgerhq/errors";

export default async (transport: Transport<*>, name: string): Promise<void> => {
  await transport.send(0xe0, 0xd4, 0x00, 0x00, Buffer.from(name)).catch(e => {
    if (e.statusCode === StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED) {
      throw new UserRefusedDeviceNameChange();
    }
    throw e;
  });
};
