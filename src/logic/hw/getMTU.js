// @flow
import Transport from "@ledgerhq/hw-transport";

export default async (transport: Transport<*>): Promise<number> => {
  const res = await transport.send(0x80, 0x00, 0x00, 0x00);
  const mtu = res.readUInt8(0);
  return mtu;
};
