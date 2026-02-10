import { bip32asBuffer } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getAddressFormatDerivationMode } from "@ledgerhq/coin-framework/derivation";
import type { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
const addressFormatMap = {
  legacy: 0,
  p2sh: 1,
  bech32: 2,
  bitcoin_cash: 3,
  bech32m: 4,
};
type FormatType = keyof typeof addressFormatMap;

export const getSerializedAddressParameters = (
  account: Account,
  addressFormat?: string,
): Buffer => {
  const path = account.freshAddressPath;
  const derivationMode = account.derivationMode;

  const format =
    addressFormat && addressFormat in addressFormatMap
      ? (addressFormat as FormatType)
      : (getAddressFormatDerivationMode(derivationMode) as FormatType);
  invariant(Object.keys(addressFormatMap).includes(format), "unsupported format %s", format);
  const buffer = bip32asBuffer(path);
  const formatByte = Buffer.from([addressFormatMap[format]]);
  // TypeScript 5.6.3 requires explicit Uint8Array conversion for Buffer.concat
  const addressParameters = Buffer.concat([
    formatByte as unknown as Uint8Array,
    buffer as unknown as Uint8Array,
  ] as Uint8Array[]);
  return addressParameters;
};
