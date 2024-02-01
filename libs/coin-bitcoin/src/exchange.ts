import { bip32asBuffer } from "@ledgerhq/crypto-utils/bip32";
import type { DerivationMode } from "@ledgerhq/types-live";
import { getAddressFormatDerivationMode } from "@ledgerhq/coin-framework/derivation";
import invariant from "invariant";
const addressFormatMap = new Map([
  ["legacy", 0],
  ["p2sh", 1],
  ["bech32", 2],
  ["bitcoin_cash", 3],
  ["bech32m", 4],
]);

const getSerializedAddressParameters = (
  path: string,
  derivationMode: DerivationMode,
  addressFormat?: string,
): {
  addressParameters: Buffer;
} => {
  const format =
    addressFormat && addressFormatMap.has(addressFormat)
      ? addressFormat
      : getAddressFormatDerivationMode(derivationMode);
  invariant(Object.keys(addressFormatMap).includes(format), "unsupported format %s", format);
  const buffer = bip32asBuffer(path);
  const addressParameters = Buffer.concat([Buffer.from([addressFormatMap.get(format)]), buffer]);
  return {
    addressParameters,
  };
};

export default {
  getSerializedAddressParameters,
};
