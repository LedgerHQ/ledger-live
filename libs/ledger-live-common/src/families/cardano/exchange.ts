import { bip32asBuffer } from "../../crypto";

const getSerializedAddressParameters = (
  path: string,
): {
  addressParameters: Buffer;
} => {
  const addressPath = bip32asBuffer(path);
  return {
    addressParameters: addressPath,
  };
};

export default {
  getSerializedAddressParameters,
};
