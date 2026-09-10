import BigNumber from "bignumber.js";
import {
  AccountAddress,
  encodePltTransferOperations,
  TransactionType,
  type TokenUpdateTransaction,
} from "@ledgerhq/concordium-core";

const EXPIRY_WINDOW_SECONDS = 3600;

/**
 * Crafts a PLT transfer as a `TokenUpdate` transaction.
 *
 * Separate from {@link craftTransaction} because `TransactionType.TokenUpdate`
 * is absent from the native `Transaction` union by construction, so one function
 * cannot return both.
 *
 * Three values come from the caller and are never derived here:
 *
 * - `tokenId` is the CAL-resolved `contract_address`, passed byte for byte. The
 *   chain matches it against a registered token, so normalising it would break
 *   the transfer.
 * - `decimals` is the CAL unit magnitude. The chain enforces
 *   `exponent == the token's registered decimals` and rejects a mismatch rather
 *   than rescaling.
 * - `energy` is the figure persisted at estimation time. Re-estimating here would
 *   sign a different number from the one the user approved.
 *
 * The recipient carries no coin info: the encoder can add the tagged network id
 * and the device accepts it, but the Concordium SDK omits it for a transfer
 * (`TokenHolder.fromAccountAddress`), so these bytes match the chain's.
 *
 * The blob holds exactly one `transfer`. The device rejects a second element with
 * `0x6B10`, and `serializeTokenUpdate` checks the array header before the user is
 * prompted.
 */
export function craftPltTransaction(
  account: {
    address: string;
    nextSequenceNumber?: number;
  },
  transaction: {
    tokenId: string;
    recipient: string;
    amount: BigNumber;
    decimals: number;
    energy: bigint;
    memo?: string;
  },
): TokenUpdateTransaction {
  const expiryEpochSeconds = Math.floor(Date.now() / 1000) + EXPIRY_WINDOW_SECONDS;
  const memo = transaction.memo ? Buffer.from(transaction.memo, "utf-8") : undefined;

  return {
    type: TransactionType.TokenUpdate,
    header: {
      sender: AccountAddress.fromBase58(account.address),
      nonce: BigInt(account.nextSequenceNumber ?? 0),
      expiry: BigInt(expiryEpochSeconds),
      energyAmount: transaction.energy,
    },
    payload: {
      tokenId: Buffer.from(transaction.tokenId, "utf-8"),
      operations: encodePltTransferOperations({
        recipient: AccountAddress.fromBase58(transaction.recipient),
        // `toFixed(0)` rather than `toString`: an amount that reached here as a
        // decimal would otherwise throw inside `BigInt` after the fee was shown.
        amount: BigInt(transaction.amount.toFixed(0)),
        decimals: transaction.decimals,
        ...(memo ? { memo } : {}),
      }),
    },
  };
}
