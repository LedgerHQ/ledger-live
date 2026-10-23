import type { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { TRANSFER_FEE } from "../consts";
import type { IcpMemo } from "../types";
import { validateMemo } from "./validation";

export type IcpIntent = TransactionIntent<IcpMemo>;

/**
 * Why the module cannot carry out the intent, or undefined when it can: native ICP sends only.
 *
 * `type` is checked too: `create_neuron` and `increase_stake` are also ledger transfers and arrive
 * as `intentType: "transaction"`, but their recipient is a governance subaccount.
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
