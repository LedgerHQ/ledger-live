import {
  TransportStatusError,
  UnexpectedBootloader,
  StatusCodes,
} from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";

/**
 * Clear an existing custom image from the device.
 */
export default async (transport: Transport): Promise<void> => {
  const res = await transport.send(0xe0, 0x63, 0x00, 0x00, Buffer.from([]), [
    StatusCodes.OK,
    StatusCodes.CUSTOM_IMAGE_BOOTLOADER,
    StatusCodes.UNKNOWN_APDU,
  ]);

  const status = res.readUInt16BE(res.length - 2);

  switch (status) {
    case StatusCodes.OK:
      return;
    case StatusCodes.CUSTOM_IMAGE_BOOTLOADER:
      throw new UnexpectedBootloader();
  }
  throw new TransportStatusError(status);
};
