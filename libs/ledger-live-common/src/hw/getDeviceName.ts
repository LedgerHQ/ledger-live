import Transport, {
  StatusCodes,
  TransportStatusError,
} from "@ledgerhq/hw-transport";

export default async (transport: Transport): Promise<string> => {
  // NB Prevents bad apdu response for LNX
  await transport.send(0xe0, 0x50, 0x00, 0x00).catch(() => {});

  const res = await transport.send(0xe0, 0xd2, 0x00, 0x00, Buffer.from([]), [
    StatusCodes.OK,
    StatusCodes.DEVICE_NOT_ONBOARDED,
    StatusCodes.DEVICE_NOT_ONBOARDED_2,
  ]);

  const status = res.readUInt16BE(res.length - 2);

  switch (status) {
    case StatusCodes.OK:
      return res.slice(0, res.length - 2).toString("utf-8");
    case StatusCodes.DEVICE_NOT_ONBOARDED:
    case StatusCodes.DEVICE_NOT_ONBOARDED_2:
      return "";
  }

  throw new TransportStatusError(status);
};
