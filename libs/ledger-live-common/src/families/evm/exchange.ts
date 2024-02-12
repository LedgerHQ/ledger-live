/**
 * This sould ideally be under libs/coin-evm/src/ but it would make this coin
 * lib depend on @ledgerhq/hw-app-btc which has no link whatsohever with EVM.
 * Also, this function is similar thoughout all coins familles handeled by exchange
 * (except Bitcoin which has a different implementation).
 * It could then be moved outside the libs/ledger-live-common/src/families/ folder
 * in order not to be duplicated thoughout all coin families.
 */

import { bip32asBuffer } from "@ledgerhq/hw-app-btc/bip32";

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
