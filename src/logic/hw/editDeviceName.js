// @flow
import Transport from "@ledgerhq/hw-transport";
import { DeviceNameRequired } from "../../errors";

export default async (transport: Transport<*>, name: string): Promise<void> => {
  if (!name) throw new DeviceNameRequired();
  // Temporary BLE implementation for demoing rename,
  // should use real APDU in final release
  // $FlowFixMe
  if (transport.renameCharacteristic) {
    const formattedName = Buffer.concat([
      Buffer.alloc(1),
      Buffer.from(name),
    ]).toString("base64");
    // $FlowFixMe
    await transport.renameCharacteristic.writeWithResponse(formattedName);
    return;
  }

  await transport.send(0xe0, 0xd4, 0x00, 0x00, Buffer.from(name));
};
