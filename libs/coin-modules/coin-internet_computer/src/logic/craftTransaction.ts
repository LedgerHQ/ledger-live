import { Cbor } from "@icp-sdk/core/agent";
import type { CraftedTransaction, FeeEstimation } from "@ledgerhq/coin-module-framework/api/index";
import { MAX_NAT64 } from "../consts";
import { InvalidMemoICP } from "../errors";
import { AccountIdentifier } from "./accountIdentifier";
import { createUnsignedTransfer } from "./buildTransaction";
import {
  type IcpIntent,
  memoOf,
  senderPublicKeyOf,
  unpayableFee,
  unsupportedIntent,
} from "./intent";
import { craftNeuronCommand, isNeuronCommandIntent } from "./neuronCommand";
import { craftStakeTransfer, isStakeTransferIntent } from "./stakeTransfer";

const NANOS_PER_MILLI = 1_000_000n;

/**
 * Craft a ledger transfer as the blob the device signs, `Cbor.encode({ content })`. A neuron command
 * is crafted by {@link craftNeuronCommand}, a stake transfer by {@link craftStakeTransfer}.
 *
 * The call carries an ingress expiry of about four minutes, reported as `details.expiresAt` (ms
 * epoch). Past it the node refuses the call, so the transaction is crafted and signed again.
 */
export function craftTransaction(
  intent: IcpIntent,
  customFees?: FeeEstimation,
): CraftedTransaction {
  if (isNeuronCommandIntent(intent)) return craftNeuronCommand(intent, customFees);
  if (isStakeTransferIntent(intent)) return craftStakeTransfer(intent, customFees);

  const unsupported = unsupportedIntent(intent);
  if (unsupported) throw new Error(`[ICP](craftTransaction) ${unsupported}`);
  const feeRefusal = unpayableFee(customFees);
  if (feeRefusal) throw new Error(`[ICP](craftTransaction) ${feeRefusal}`);

  const { recipient, amount } = intent;
  const senderPublicKey = senderPublicKeyOf(intent);
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
