import { Cbor } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import type { CraftedTransaction, FeeEstimation } from "@ledgerhq/coin-module-framework/api/index";
import {
  AmountRequired,
  InvalidAddress,
  InvalidTransactionError,
  RecipientRequired,
} from "@ledgerhq/coin-module-framework/errors";
import { BigNumber } from "bignumber.js";
import { parseNeuronId } from "../common-logic/neuron";
import {
  E8S_PER_ICP,
  MAINNET_GOVERNANCE_CANISTER_ID,
  MAX_NAT64,
  MIN_NEURON_STAKE,
} from "../consts";
import {
  ICPCallUnconfirmed,
  ICPNodeRefused,
  ICPStakeMemoNotRecoverable,
  ICPStakeNotRefreshed,
  ICPTopUpBelowMinimumStake,
  NotEnoughTransferAmount,
} from "../errors";
import {
  claimOrRefreshNeuronFromAccount,
  findNeuronIdBySubaccount,
  queryLedgerBalance,
} from "../network/api";
import { AccountIdentifier } from "./accountIdentifier";
import {
  getNeuronStakeSubAccount,
  getNeuronStakeSubAccountIdentifier,
} from "./buildNeuronTransaction";
import { createUnsignedTransfer } from "./buildTransaction";
import {
  fieldError,
  type IcpIntent,
  type IcpStakingIntent,
  memoOf,
  neuronDataOf,
  senderPublicKeyOf,
  signerPrincipalOf,
  unpayableFee,
} from "./intent";

const NANOS_PER_MILLI = 1_000_000n;

const STAKE_TRANSFER_TYPES: ReadonlySet<string> = new Set(["create_neuron", "increase_stake"]);

/**
 * A staking intent for a ledger transfer to a neuron's stake account: `create_neuron` names the
 * governance canister in `valAddress`, `increase_stake` the neuron id.
 */
export const isStakeTransferIntent = (intent: IcpIntent): intent is IcpStakingIntent =>
  intent.intentType === "staking" && STAKE_TRANSFER_TYPES.has(intent.type);

/** A stake nonce as a Nat64, or undefined when the text is not one. */
export const parseStakeNonce = (text: unknown): bigint | undefined => {
  if (typeof text !== "string" || !/^\d+$/.test(text)) return undefined;
  const nonce = BigInt(text);
  return nonce <= MAX_NAT64 ? nonce : undefined;
};

/** A stake transfer the module can craft: the nonce names the neuron's stake account. */
export interface StakeTransfer {
  recipient: string;
  amount: bigint;
  memo: bigint;
  nonce: bigint;
  /** The neuron a top-up names, in canonical form; absent for a create. */
  neuronId?: string;
}

/**
 * Why the stake account rules the transfer out, or undefined, read from governance and the ledger.
 * A create needs an unused account: no neuron, and no balance, since an unclaimed transfer can sit
 * there without one. A top-up needs the account to hold the neuron it names, and to reach the
 * minimum stake with the top-up, since the refresh that follows reads the account's ledger balance
 * against that minimum. A read that is not answered refuses the transfer.
 *
 * These are checks before signing, and best-effort: the state can change before the transfer runs.
 * Broadcast does not repeat them, so a resubmitted transfer that already settled still reaches the
 * ledger, which reports it as a duplicate, and is claimed.
 */
export async function checkStakeAccount(
  controller: Principal,
  { nonce, neuronId, amount }: { nonce: bigint; neuronId?: string | undefined; amount: bigint },
): Promise<Error | undefined> {
  let held: string | undefined;
  let balance: bigint;
  try {
    [held, balance] = await Promise.all([
      findNeuronIdBySubaccount(getNeuronStakeSubAccount(controller, nonce)),
      queryLedgerBalance(getNeuronStakeSubAccountIdentifier(controller, nonce)),
    ]);
  } catch (error) {
    return Object.assign(new InvalidTransactionError("The stake account could not be read"), {
      cause: error,
    });
  }

  if (neuronId === undefined) {
    return held !== undefined || balance > 0n
      ? new InvalidTransactionError("The stake nonce is already in use")
      : undefined;
  }
  if (held !== neuronId) {
    return new InvalidTransactionError(
      held === undefined
        ? "No neuron holds the stake account of the nonce"
        : `The stake nonce names neuron ${held}, not ${neuronId}`,
    );
  }
  const minimum = BigInt(MIN_NEURON_STAKE) - balance;
  if (amount >= minimum) return undefined;
  return fieldError(
    "amount",
    new ICPTopUpBelowMinimumStake("", {
      missing: new BigNumber(minimum.toString()).div(E8S_PER_ICP).toString(),
    }),
  );
}

// A create_neuron transfer carries its nonce as memo, which is how history tells a stake from a
// top-up: a top-up carries memo 0. So a create cannot use nonce 0.
const nonceOf = (intent: IcpStakingIntent): bigint | Error => {
  const text = neuronDataOf(intent)?.stakeNonce;
  if (text === undefined) {
    return intent.type === "increase_stake"
      ? new ICPStakeMemoNotRecoverable()
      : new InvalidTransactionError("create_neuron requires stakeNonce");
  }
  const nonce = parseStakeNonce(text);
  if (nonce === undefined) return new InvalidTransactionError(`Not a stake nonce: ${text}`);
  if (nonce === 0n && intent.type === "create_neuron") {
    return new InvalidTransactionError("create_neuron requires a non-zero stakeNonce");
  }
  return nonce;
};

// The neuron a top-up names, undefined for a create, or the error that says why `valAddress` is wrong.
const targetOf = ({ type, valAddress }: IcpStakingIntent): string | undefined | Error => {
  if (type === "create_neuron") {
    return valAddress === MAINNET_GOVERNANCE_CANISTER_ID
      ? undefined
      : new InvalidTransactionError("create_neuron targets the governance canister");
  }
  return (
    parseNeuronId(valAddress).id ?? new InvalidTransactionError(`Not a neuron id: ${valAddress}`)
  );
};

const amountError = (type: string, amount: bigint): Error | undefined => {
  if (type === "create_neuron" && amount < BigInt(MIN_NEURON_STAKE)) {
    return new NotEnoughTransferAmount();
  }
  if (amount <= 0n) return new AmountRequired();
  if (amount > MAX_NAT64) return new InvalidTransactionError(`The amount exceeds ${MAX_NAT64}`);
  return undefined;
};

/**
 * The stake transfer the intent asks for, or the first error that says why it cannot be crafted.
 * `errorFieldOf` names the intent field an error concerns. Only checks that need no network run
 * here; {@link checkStakeAccount} reads the stake account for the rest.
 *
 * The recipient must be the stake account the sender's principal and the nonce derive. Without a
 * usable public key, that check is skipped; crafting requires one.
 *
 * @param amount the amount to transfer, which differs from `intent.amount` when it sends it all
 */
export function stakeTransferOf(
  intent: IcpStakingIntent,
  amount: bigint = intent.amount,
): StakeTransfer | Error {
  if (intent.asset.type !== "native") {
    return new InvalidTransactionError(`${intent.asset.type} assets are not supported`);
  }
  const neuronId = targetOf(intent);
  if (neuronId instanceof Error) return neuronId;
  const nonce = nonceOf(intent);
  if (nonce instanceof Error) return nonce;
  const memo = intent.type === "create_neuron" ? nonce : 0n;
  // The memo is the nonce or 0 by the rule above, so an intent that sets another one is refused.
  // The generic mapping sends `{ type: "none" }` for an intent with no memo. The intent type has no
  // `memo` field for that branch of IcpMemo, so the field is read as a plain tagged object.
  const requested: { type: string } | undefined = "memo" in intent ? intent.memo : undefined;
  if (
    requested &&
    requested.type !== "none" &&
    (requested.type !== "string" || memoOf(intent) !== memo)
  ) {
    return new InvalidTransactionError(`The memo of a ${intent.type} transfer is ${memo}`);
  }

  const { recipient } = intent;
  if (!recipient) return fieldError("recipient", new RecipientRequired());
  if (!AccountIdentifier.isValid(recipient)) {
    return fieldError("recipient", new InvalidAddress("", { currencyName: "Internet Computer" }));
  }
  const signer = signerPrincipalOf(intent);
  if (signer && getNeuronStakeSubAccountIdentifier(signer, nonce) !== recipient.toLowerCase()) {
    return fieldError(
      "recipient",
      new InvalidTransactionError("The recipient is not the stake account of the nonce"),
    );
  }

  const invalidAmount = amountError(intent.type, amount);
  if (invalidAmount) return fieldError("amount", invalidAmount);
  return {
    recipient: recipient.toLowerCase(),
    amount,
    memo,
    nonce,
    ...(neuronId === undefined ? {} : { neuronId }),
  };
}

/**
 * Craft a stake transfer as `Cbor.encode({ content, stake_nonce })`. The device signs
 * `Cbor.encode({ content })` only, as for a send; `stake_nonce` is the decimal nonce that broadcast
 * claims or refreshes the neuron with, once the transfer settles.
 *
 * `details.expiresAt` is the ingress expiry (ms epoch).
 */
export function craftStakeTransfer(
  intent: IcpStakingIntent,
  customFees?: FeeEstimation,
): CraftedTransaction {
  const feeRefusal = unpayableFee(customFees);
  if (feeRefusal) throw new Error(`[ICP](craftTransaction) ${feeRefusal}`);
  const senderPublicKey = senderPublicKeyOf(intent);
  const transfer = stakeTransferOf(intent);
  if (transfer instanceof Error) throw transfer;

  const { recipient, amount, memo, nonce } = transfer;
  const { unsignedTransaction } = createUnsignedTransfer(
    { recipient, amount, memo },
    senderPublicKey,
  );

  return {
    transaction: Buffer.from(
      Cbor.encode({ content: unsignedTransaction, stake_nonce: nonce.toString() }),
    ).toString("hex"),
    details: {
      expiresAt: Number(unsignedTransaction.ingress_expiry.toBigInt() / NANOS_PER_MILLI),
    },
  };
}

/**
 * Claim or refresh the neuron whose stake account `controller` and `nonce` derive, and return its
 * id. It needs no signature and is idempotent, so it completes a stake transfer whose claim failed
 * after the transfer settled.
 *
 * Throws ICPStakeNotRefreshed when governance or the network refuses the claim, and
 * ICPCallUnconfirmed when no answer settles it; `cause` then carries the failure that stopped the
 * attempt. A controller or nonce it cannot read throws before anything is sent.
 *
 * @param controller the principal text of the account that made the transfer
 * @param nonce the decimal stake nonce
 */
export async function refreshNeuronStake(controller: string, nonce: string): Promise<string> {
  const parsed = parseStakeNonce(nonce);
  if (parsed === undefined) {
    throw new Error(`[ICP](refreshNeuronStake) Not a stake nonce: ${nonce}`);
  }
  const principal = Principal.fromText(controller);
  let neuronId: bigint | undefined;
  try {
    neuronId = await claimOrRefreshNeuronFromAccount(principal, parsed);
  } catch (error) {
    if (error instanceof ICPStakeNotRefreshed || error instanceof ICPCallUnconfirmed) throw error;
    // The node turned the claim away: it never ran, so the stake stays unclaimed.
    if (error instanceof ICPNodeRefused) {
      const reason = typeof error.reason === "string" ? error.reason : "";
      throw new ICPStakeNotRefreshed(reason || "ICPStakeNotRefreshed", { reason, cause: error });
    }
    throw new ICPCallUnconfirmed("ICPCallUnconfirmed", { cause: error });
  }
  if (neuronId === undefined) throw new ICPCallUnconfirmed();
  return neuronId.toString();
}
