// @flow

import { bip32asBuffer } from "@ledgerhq/hw-app-btc/lib/bip32";
import type { DerivationMode } from "../../derivation";
import { getAddressFormatDerivationMode } from "../../derivation";
import invariant from "invariant";

const addressFormatMap = {
  legacy: 0,
  p2sh: 1,
  bech32: 2,
};

/**
 * Swap app is expecting we pass the output of this as a concat buffer.
 * To check if it will be different per family or not once more families
 * are supported.
 * https://github.com/teams2ua/ledgerjs/blob/hw-swap-app/packages/hw-app-swap/src/Swap.js#L85-L104
 */
const getSerializedAddressParameters = (
  path: string,
  derivationMode: DerivationMode
): { addressParameters: Buffer } => {
  const format = getAddressFormatDerivationMode(derivationMode);
  invariant(
    format === "legacy" || format === "p2sh" || format === "bech32",
    "unsupported format %s",
    format
  );

  const buffer = bip32asBuffer(path);
  const addressParameters = Buffer.concat([
    Buffer.from([addressFormatMap[format]]),
    buffer,
  ]);
  return { addressParameters };
};

export default { getSerializedAddressParameters };
