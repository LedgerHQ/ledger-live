import BigNumber from "bignumber.js";

export const CASPER_MAX_TRANSFER_ID = "18446744073709551615";

/**
 * Casper memo is a transfer id. We keep the same function signature across chain to make the code
 * easier to read and have a common pattern.
 *
 * @param transferId transfer id to validate
 * @returns true if transfer id is valid, otherwise false
 */
export function validateMemo(transferId?: string): boolean {
  if (!transferId || !transferId.length) {
    return true;
  }

  return (
    /^\d+$/.test(transferId) && new BigNumber(transferId).lt(new BigNumber(CASPER_MAX_TRANSFER_ID))
  );
}
