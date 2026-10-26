import { Cbor } from "@icp-sdk/core/agent";
import type { CraftedTransaction, FeeEstimation } from "@ledgerhq/coin-module-framework/api/index";
import { MAX_NAT64 } from "../consts";
import { InvalidMemoICP } from "../errors";
import { AccountIdentifier } from "./accountIdentifier";
import { createUnsignedTransfer } from "./buildTransaction";
import { deriveAddressFromPubkey } from "./crypto";
import { type IcpIntent, memoOf, unpayableFee, unsupportedIntent } from "./intent";

const NANOS_PER_MILLI = 1_000_000n;

/**
 * Craft a ledger transfer as the blob the device signs, `Cbor.encode({ content })`.
 *
 * The call carries an ingress expiry of about four minutes, reported as `details.expiresAt` (ms
 * epoch). Past it the node refuses the call, so the transaction is crafted and signed again.
 */
export function craftTransaction(
  intent: IcpIntent,
  customFees?: FeeEstimation,
): CraftedTransaction {
  const unsupported = unsupportedIntent(intent);
  if (unsupported) throw new Error(`[ICP](craftTransaction) ${unsupported}`);
  const feeRefusal = unpayableFee(customFees);
  if (feeRefusal) throw new Error(`[ICP](craftTransaction) ${feeRefusal}`);

  const { senderPublicKey, sender, recipient, amount } = intent;
  if (!senderPublicKey) throw new Error("[ICP](craftTransaction) senderPublicKey is required");
  // The call is signed by the key's principal and debits that principal's default account only.
  if (deriveAddressFromPubkey(senderPublicKey) !== sender.toLowerCase()) {
    throw new Error("[ICP](craftTransaction) sender is not the default account of senderPublicKey");
  }
  if (!AccountIdentifier.isValid(recipient)) {
    throw new Error(`[ICP](craftTransaction) Invalid recipient: ${recipient}`);
  }
  if (amount <= 0n || amount > MAX_NAT64) {
    throw new Error(`[ICP](craftTransaction) Invalid amount: ${amount}`);
  }
  const memo = memoOf(intent);
  if (memo === undefined) throw new InvalidMemoICP();

  const { unsignedTransaction } = createUnsignedTransfer(
    { recipient, amount, memo },
    senderPublicKey,
  );

  return {
    transaction: Buffer.from(Cbor.encode({ content: unsignedTransaction })).toString("hex"),
    details: {
      expiresAt: Number(unsignedTransaction.ingress_expiry.toBigInt() / NANOS_PER_MILLI),
    },
  };
}
