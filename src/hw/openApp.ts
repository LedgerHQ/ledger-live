import Transport from "@ledgerhq/hw-transport";
export default async (transport: Transport, name: string): Promise<void> => {
  await transport.send(0xe0, 0xd8, 0x00, 0x00, Buffer.from(name, "ascii"));
};
