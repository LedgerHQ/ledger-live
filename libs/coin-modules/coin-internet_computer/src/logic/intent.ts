import type { Principal } from "@icp-sdk/core/principal";
import type {
  FeeEstimation,
  StakingTransactionIntent,
  TransactionIntent,
  TxData,
  TxDataNotSupported,
} from "@ledgerhq/coin-module-framework/api/index";
import { TRANSFER_FEE } from "../consts";
import type { IcpMemo } from "../types";
import { deriveAddressFromPubkey, derivePrincipalFromPubkey } from "./crypto";
import { validateMemo } from "./validation";

/** The parameters of a neuron operation that the intent's own fields cannot carry. */
export interface IcpNeuronCommandData extends TxData {
  type: "neuron";
  /**
   * The nonce that names the neuron's stake account, a decimal Nat64 (`create_neuron`,
   * `increase_stake`). A create_neuron transfer carries it as its memo.
   */
  stakeNonce?: string;
  /** Seconds to add to the dissolve delay (`increase_dissolve_delay`). */
  additionalDissolveDelaySeconds?: number;
  /** The dissolve delay to set, in seconds from now (`set_dissolve_delay`). */
  dissolveDelaySeconds?: number;
  /** The principal to add or remove (`add_hot_key`, `remove_hot_key`). */
  hotKey?: string;
  /** Whether governance stakes new maturity on its own (`auto_stake_maturity`). */
  autoStakeMaturity?: boolean;
  /** The share of maturity to use, 1 to 100; absent means all (`spawn_neuron`, `stake_maturity`). */
  percentage?: number;
  /** The topic to follow on; absent means `Unspecified` (`follow`). */
  followTopic?: string;
  /** The neurons to follow on the topic; empty clears it (`follow`). */
  followeeIds?: string[];
}

export type IcpTxData = TxDataNotSupported | IcpNeuronCommandData;

export type IcpIntent = TransactionIntent<IcpMemo, IcpTxData>;

/**
 * A neuron operation: `type` names it and `valAddress` the neuron id, or the governance canister id
 * for a `create_neuron`.
 */
export type IcpStakingIntent = StakingTransactionIntent<IcpMemo, IcpTxData>;

/** The intent field an error concerns, when it is not the transaction as a whole. */
type ErrorField = "amount" | "recipient";

const errorFields = new WeakMap<Error, ErrorField>();

/** Tag `error` as concerning the intent's `field`. */
export const fieldError = (field: ErrorField, error: Error): Error => {
  errorFields.set(error, field);
  return error;
};

/** The intent field a neuron operation's error concerns, or `transaction`. */
export const errorFieldOf = (error: Error): ErrorField | "transaction" =>
  errorFields.get(error) ?? "transaction";

/** The neuron data the intent carries, if any. */
export const neuronDataOf = (intent: IcpStakingIntent): IcpNeuronCommandData | undefined => {
  const data = "data" in intent ? intent.data : undefined;
  return data?.type === "neuron" ? data : undefined;
};

/** The principal of the sender's public key, or undefined when the intent carries no usable one. */
export const signerPrincipalOf = ({ senderPublicKey }: IcpIntent): Principal | undefined => {
  if (!senderPublicKey) return undefined;
  try {
    return derivePrincipalFromPubkey(senderPublicKey);
  } catch {
    return undefined;
  }
};

/**
 * The sender's public key. The call is signed by the key's principal and acts for that principal's
 * default account only, so the sender must be that account.
 */
export function senderPublicKeyOf({ sender, senderPublicKey }: IcpIntent): string {
  if (!senderPublicKey) throw new Error("[ICP](craftTransaction) senderPublicKey is required");
  if (deriveAddressFromPubkey(senderPublicKey) !== sender.toLowerCase()) {
    throw new Error("[ICP](craftTransaction) sender is not the default account of senderPublicKey");
  }
  return senderPublicKey;
}

/**
 * Why the module cannot carry out the intent as a send, or undefined when it can: native ICP sends
 * only. A neuron operation, stake transfers included, is a staking intent.
 */
export function unsupportedIntent(intent: IcpIntent): string | undefined {
  if (intent.intentType !== "transaction") return `${intent.intentType} intents are not supported`;
  if (intent.type !== "send") return `${intent.type} transactions are not supported`;
  if (intent.asset.type !== "native") return `${intent.asset.type} assets are not supported`;
  return undefined;
}

/** Why the custom fee cannot be paid, or undefined. A zero fee is one the caller has not set yet. */
export function unpayableFee(customFees: FeeEstimation | undefined): string | undefined {
  const fee = customFees?.value ?? 0n;
  return fee === 0n || fee === TRANSFER_FEE ? undefined : `The fee must be ${TRANSFER_FEE}`;
}

/** The transfer memo: 0 when the intent carries none, undefined when it is not a Nat64. */
export function memoOf(intent: IcpIntent): bigint | undefined {
  const memo = "memo" in intent ? intent.memo : undefined;
  if (memo?.type !== "string") return 0n;
  return validateMemo(memo.value).isValid ? BigInt(memo.value) : undefined;
}
