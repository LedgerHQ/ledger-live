import invariant from "invariant";
import type { Account } from "@ledgerhq/types-live";
import { bip32asBuffer } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { getAddressFormatDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";

const addressFormatMap = {
  legacy: 0,
  p2sh: 1,
  bech32: 2,
  bitcoin_cash: 3,
  bech32m: 4,
};
type FormatType = keyof typeof addressFormatMap;

/** The address the swap flow pays to: format byte, then the BIP32 path of the fresh address. */
export const getSerializedAddressParameters = (
  account: Account,
  addressFormat?: string,
): Buffer => {
  const format =
    addressFormat && addressFormat in addressFormatMap
      ? (addressFormat as FormatType)
      : (getAddressFormatDerivationMode(account.derivationMode) as FormatType);
  invariant(Object.keys(addressFormatMap).includes(format), "unsupported format %s", format);
  return Buffer.concat([
    Buffer.from([addressFormatMap[format]]),
    bip32asBuffer(account.freshAddressPath),
  ]);
};
