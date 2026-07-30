import type {
  CraftedTransaction,
  FeeEstimation,
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import * as nearAPI from "near-api-js";
import { getAccessKey } from "../../network";
import { buildActions } from "../actions";
import { isValidAddress } from "../../logic";

export type NearIntent = TransactionIntent | StakingTransactionIntent;

/**
 * The framework names a staking operation in two vocabularies: `mode`, from the delegation set,
 * which it only fills in when the transaction carries a validator address or id, and `type`, which
 * it always sets. Both map onto the module's internal modes.
 */
const STAKING_MODES: Record<string, string> = {
  delegate: "stake",
  undelegate: "unstake",
  withdraw: "withdraw",
  stake: "stake",
  unstake: "unstake",
  finalize_unstake: "withdraw",
};

const isStakingIntent = (intent: NearIntent): intent is StakingTransactionIntent =>
  intent.intentType === "staking";

/**
 * The module's internal mode plus the account the transaction is addressed to. For staking that is
 * the pool contract, which the framework carries as `valAddress` when the transaction has one and
 * as the recipient otherwise.
 *
 * An absent target is returned as an empty string rather than raised: the framework prices and
 * validates a transaction while the user is still filling the form, and only crafting genuinely
 * needs the target.
 */
export function resolveTarget(intent: NearIntent): { mode: string; receiverId: string } {
  if (!isStakingIntent(intent)) {
    return { mode: "send", receiverId: intent.recipient };
  }

  const operation = intent.mode ?? (intent as { type?: string }).type;
  const mode = operation ? STAKING_MODES[operation] : undefined;
  if (!mode) {
    throw new Error(`Near: staking operation ${operation} is not supported`);
  }

  return { mode, receiverId: intent.valAddress || intent.recipient || "" };
}

/**
 * Craft an unsigned transaction, Borsh-encoded and base64'd, which is what {@link combine} takes
 * back and what the device signs.
 *
 * The sender public key is required: a NEAR transaction embeds it, and the nonce is scoped to that
 * key's access key rather than to the account, so it cannot be resolved from the address alone.
 * That is also why `getNextSequence` is not implemented; the nonce is fetched here.
 */
export async function craftTransaction(
  intent: NearIntent,
  _customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  if (!intent.senderPublicKey) {
    throw new Error("Near: senderPublicKey is required to craft a transaction");
  }

  const { mode, receiverId } = resolveTarget(intent);

  if (!receiverId) {
    throw new Error(
      isStakingIntent(intent)
        ? "Near: a validator address is required for a staking transaction"
        : "Near: recipient is required",
    );
  }

  // Validated up front because both feed the access-key lookup below: a malformed value should
  // fail here rather than after a wasted network round trip.
  if (!isValidAddress(intent.sender)) {
    throw new Error(`Near: invalid sender address ${intent.sender}`);
  }
  if (!isValidAddress(receiverId)) {
    throw new Error(`Near: invalid recipient address ${receiverId}`);
  }

  const { nonce, block_hash } = await getAccessKey({
    address: intent.sender,
    publicKey: intent.senderPublicKey,
  });

  if (block_hash === undefined || nonce === undefined) {
    throw new Error(`Near: no access key found for ${intent.sender}`);
  }

  const actions = buildActions({
    mode,
    amount: intent.amount.toString(),
    useAllAmount: intent.useAllAmount ?? false,
  });

  const transaction = nearAPI.transactions.createTransaction(
    intent.sender,
    nearAPI.utils.PublicKey.fromString(intent.senderPublicKey),
    receiverId,
    nonce + 1,
    actions,
    nearAPI.utils.serialize.base_decode(block_hash),
  );

  return {
    transaction: Buffer.from(transaction.encode()).toString("base64"),
    details: { mode, nonce: nonce + 1, receiverId },
  };
}
