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

// The framework names a staking op via `mode` (delegation set, only filled when a validator is
// set) or `type` (always set); both map onto the module's internal modes.
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

// The module's internal mode plus the transaction's target (the pool contract for staking, carried
// as `valAddress` or else the recipient). An absent target returns "" rather than throwing: pricing
// and validation run while the form is still being filled, only crafting genuinely needs it.
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

// Crafts an unsigned, Borsh-encoded + base64 transaction for {@link combine} and device signing.
// senderPublicKey is required: the nonce is scoped to that access key, not the account, so it's
// fetched here rather than via `getNextSequence` (which isn't implemented for that reason).
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
