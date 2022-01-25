import Transport from "@ledgerhq/hw-transport";
import { UserRefusedDeviceNameChange } from "@ledgerhq/errors";
export default async (transport: Transport, name: string): Promise<void> => {
  await transport.send(0xe0, 0xd4, 0x00, 0x00, Buffer.from(name)).catch((e) => {
    if (e.statusCode === 0x6985 || e.statusCode === 0x5501) {
      throw new UserRefusedDeviceNameChange();
    }

    throw e;
  });
};
