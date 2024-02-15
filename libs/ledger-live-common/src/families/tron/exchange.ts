import { bip32asBuffer } from "../../crypto";

const getSerializedAddressParameters = (
  path: string,
): {
  addressParameters: Buffer;
} => {
  const addressParameters = bip32asBuffer(path);
  return {
    addressParameters,
  };
};

export default {
  getSerializedAddressParameters,
};
