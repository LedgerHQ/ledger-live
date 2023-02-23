import { bip32asBuffer } from "@ledgerhq/hw-app-btc/bip32";
import type { DerivationMode } from "@ledgerhq/coin-framework/derivation";
import { getAddressFormatDerivationMode } from "@ledgerhq/coin-framework/derivation";
import invariant from "invariant";
const addressFormatMap = {
  legacy: 0,
  p2sh: 1,
  bech32: 2,
  bitcoin_cash: 3,
  bech32m: 4,
};

const getSerializedAddressParameters = (
  path: string,
  derivationMode: DerivationMode,
  addressFormat?: string
): {
  addressParameters: Buffer;
} => {
  const format =
    addressFormat && addressFormat in addressFormatMap
      ? addressFormat
      : getAddressFormatDerivationMode(derivationMode);
  invariant(
    Object.keys(addressFormatMap).includes(format),
    "unsupported format %s",
    format
  );
  const buffer = bip32asBuffer(path);
  const addressParameters = Buffer.concat([
    Buffer.from([addressFormatMap[format]]),
    buffer,
  ]);
  return {
    addressParameters,
  };
};

export default {
  getSerializedAddressParameters,
};
