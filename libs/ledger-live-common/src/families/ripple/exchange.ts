import { bip32asBuffer } from "../../crypto";
import { normalizeXrplProtocolPath } from "@ledgerhq/hw-app-xah";

const getSerializedAddressParameters = (
  path: string,
): {
  addressParameters: Buffer;
} => {
  const addressParameters = bip32asBuffer(normalizeXrplProtocolPath(path));
  return {
    addressParameters,
  };
};

export default {
  getSerializedAddressParameters,
};
