import { bip32asBuffer } from "@ledgerhq/crypto-utils/bip32";

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
