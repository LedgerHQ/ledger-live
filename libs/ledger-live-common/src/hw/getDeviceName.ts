import Transport from "@ledgerhq/hw-transport";
export default async (transport: Transport): Promise<string> => {
  const res = await transport.send(0xe0, 0xd2, 0x00, 0x00);
  return res.slice(0, res.length - 2).toString("utf-8");
};
