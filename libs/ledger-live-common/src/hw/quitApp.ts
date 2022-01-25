import Transport from "@ledgerhq/hw-transport";
export default async (transport: Transport): Promise<void> => {
  await transport.send(0xb0, 0xa7, 0x00, 0x00);
};
