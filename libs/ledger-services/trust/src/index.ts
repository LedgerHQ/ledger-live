/*
 * Trust Service
 *
 * Use only exposed methods below outside of this module.
 */

import { getPublicKey } from "./hedera";
import { computedTokenAddress, getOwnerAddress } from "./solana";

export default {
  computedTokenAddress,
  getOwnerAddress,
  hedera: {
    getPublicKey,
  },
};
