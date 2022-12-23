import {
  TransportStatusError,
  UnexpectedBootloader,
  StatusCodes,
} from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";

/**
 * Attempt to fetch the size of the custom image set on the device,
 * or zero if there is no custom image set.
 */
export default async (transport: Transport): Promise<number> => {
  const res = await transport.send(0xe0, 0x64, 0x00, 0x00, Buffer.from([]), [
    StatusCodes.OK,
    StatusCodes.CUSTOM_IMAGE_BOOTLOADER,
  ]);

  const status = res.readUInt16BE(res.length - 2);

  switch (status) {
    case StatusCodes.OK:
      return res.readUInt32BE();
    case StatusCodes.CUSTOM_IMAGE_EMPTY:
      return 0;
    case StatusCodes.CUSTOM_IMAGE_BOOTLOADER:
      throw new UnexpectedBootloader();
  }
  throw new TransportStatusError(status);
};
