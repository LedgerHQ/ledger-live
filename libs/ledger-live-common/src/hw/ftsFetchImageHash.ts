import {
  TransportStatusError,
  UnexpectedBootloader,
  StatusCodes,
} from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";

/**
 * Attempt to fetch a hash of the custom image loaded on the device.
 * We will not consider the 0x662e status code an error since it just
 * means empty custom image and an empty string will fit better.
 */
export default async (transport: Transport): Promise<string> => {
  const res = await transport.send(0xe0, 0x66, 0x00, 0x00, Buffer.from([]), [
    StatusCodes.OK,
    StatusCodes.CUSTOM_IMAGE_EMPTY,
    StatusCodes.CUSTOM_IMAGE_BOOTLOADER,
  ]);
  const status = res.readUInt16BE(res.length - 2);

  switch (status) {
    case StatusCodes.OK:
      return res.slice(0, res.length - 2).toString("hex");
    case StatusCodes.CUSTOM_IMAGE_EMPTY:
      return "";
    case StatusCodes.CUSTOM_IMAGE_BOOTLOADER:
      throw new UnexpectedBootloader();
  }
  throw new TransportStatusError(status);
};
