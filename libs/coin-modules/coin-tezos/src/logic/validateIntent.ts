import { TransactionIntent, TransactionValidation } from "@ledgerhq/coin-framework/lib/api/types";
import { InvalidAddress, RecipientRequired, RecommendUndelegation } from "@ledgerhq/errors";
import { validateAddress, ValidationResult } from "@taquito/utils";
import api from "../network/tzkt";
import { estimateFees } from "./estimateFees";
import { TezosOperationMode } from "../types";

export async function validateIntent(intent: TransactionIntent): Promise<TransactionValidation> {
  // central place to validate amounts/fees for generic bridge
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  let estimatedFees: bigint;
  let amount: bigint;
  let totalSpent: bigint;

  // basic recipient validation for send
  if (intent.type === "send") {
    if (!intent.recipient) {
      errors.recipient = new RecipientRequired("");
      return { errors, warnings, estimatedFees: 0n, amount: 0n, totalSpent: 0n };
    }
    if (validateAddress(intent.recipient) !== ValidationResult.VALID) {
      errors.recipient = new InvalidAddress(undefined, { currencyName: "Tezos" });
      return { errors, warnings, estimatedFees: 0n, amount: 0n, totalSpent: 0n };
    }
  }

  // avoid taquito error `contract.empty_transaction` when amount is 0 during typing
  // do not short-circuit when useAllAmount is enabled (send max path)
  if (intent.type === "send" && intent.amount === 0n && !intent.useAllAmount) {
    estimatedFees = 0n;
    amount = 0n;
    totalSpent = 0n;
    return { errors, warnings, estimatedFees, amount, totalSpent };
  }

  try {
    // send max not allowed on delegated accounts (must undelegate acc first)
    const senderInfo = await api.getAccountByAddress(intent.sender);
    if (senderInfo.type !== "user") throw new Error("unexpected account type");

    if (intent.type === "send" && intent.useAllAmount) {
        if (senderInfo.type === "user" && senderInfo.delegate?.address) {
        errors.amount = new RecommendUndelegation();
        return { errors, warnings, estimatedFees: 0n, amount: 0n, totalSpent: 0n };
      }
    }

    const estimation = await estimateFees({
        account: {
          address: intent.sender,
          revealed: senderInfo.revealed,
          balance: BigInt(senderInfo.balance),
          // try intent public key first and fallback to tzkt public key
          xpub: intent.senderPublicKey ?? senderInfo.publicKey,
        },
        transaction: {
          // reuse the same mapping as craft, keeping generic intent at the api boundary
          mode: (intent.type === "stake"
            ? "delegate"
            : intent.type === "unstake"
            ? "undelegate"
            : intent.type) as TezosOperationMode,
          recipient: intent.recipient,
          amount: intent.amount,
          // important for send max: legacy estimator needs this flag to pre-estimate fees
          useAllAmount: !!intent.useAllAmount,
        },
    });
    estimatedFees = estimation.estimatedFees;

    if (intent.type === "stake" || intent.type === "unstake") {
      amount = BigInt(senderInfo.type === "user" ? senderInfo.balance : 0);
      totalSpent = estimatedFees;
    } else if (intent.type === "send" && intent.useAllAmount) {
      // send max: amount = balance - fees (clamped to >= 0)
      if (senderInfo.type === "user") {
        const bal = BigInt(senderInfo.balance);
        amount = bal > estimatedFees ? bal - estimatedFees : 0n;
        totalSpent = amount + estimatedFees;
      } else {
        amount = 0n;
        totalSpent = 0n;
      }
    } else {
      amount = intent.amount;
      totalSpent = amount + estimatedFees;
    }

    // basic sanity check on balance coverage
    if (senderInfo.type === "user") {
      const accountBalance = BigInt(senderInfo.balance);
      if (totalSpent > accountBalance) {
        errors.amount = new Error("Insufficient balance");
      }
    }

  } catch (e) {
    errors.estimation = e as Error;
    estimatedFees = 0n;
    amount = intent.amount;
    totalSpent = intent.amount;
  }

  return { errors, warnings, estimatedFees, amount, totalSpent };
}