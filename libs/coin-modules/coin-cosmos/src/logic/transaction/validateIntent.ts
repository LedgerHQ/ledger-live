import {
  Balance,
  FeeEstimation,
  MemoNotSupported,
  StakingTransactionIntent,
  StringMemo,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  AmountRequired,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
  RedelegateDstValAddressRequired,
  ValAddressRequired,
} from "@ledgerhq/errors";
import { validateAddress } from "../validateAddress";

function clampPositive(value: bigint): bigint {
  return value > 0n ? value : 0n;
}

/**
 * Validate a native transfer intent — mirrors the bridge `getTransactionStatus`
 * send-mode rules in the Alpaca `TransactionValidation` shape.
 */
export async function validateIntent(
  currencyId: string,
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  if (intent.intentType === "staking") {
    return validateStakingIntent(
      intent as StakingTransactionIntent,
      balances,
      customFees?.value ?? 0n,
    );
  }

  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const estimatedFees = customFees?.value ?? 0n;

  if (!intent.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (intent.sender === intent.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!(await validateAddress(intent.recipient, { currencyId }))) {
    errors.recipient = new InvalidAddress();
  }

  const native = balances.find(b => b.asset.type === "native");
  const available = (native?.value ?? 0n) - (native?.locked ?? 0n);

  const amount = intent.useAllAmount ? clampPositive(available - estimatedFees) : intent.amount;

  if (amount <= 0n) {
    // useAllAmount with nothing left after fees is insufficient balance, not a missing amount.
    errors.amount = intent.useAllAmount ? new NotEnoughBalance() : new AmountRequired();
  } else if (amount + estimatedFees > available) {
    errors.amount = new NotEnoughBalance();
  }

  if (amount > 0n && estimatedFees * 10n > amount) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  const totalSpent = amount + estimatedFees;

  return { errors, warnings, estimatedFees, amount, totalSpent };
}

/**
 * Validate a staking intent: requires a validator address (and a destination for
 * redelegate); `claimReward` carries no amount and must not error on that.
 */
function validateStakingIntent(
  intent: StakingTransactionIntent,
  balances: Balance[],
  estimatedFees: bigint,
): TransactionValidation {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  if (!intent.valAddress) {
    errors.valAddress = new ValAddressRequired();
  }
  if (intent.mode === "redelegate" && !intent.dstValAddress) {
    errors.dstValAddress = new RedelegateDstValAddressRequired();
  }

  const native = balances.find(b => b.asset.type === "native");
  const available = (native?.value ?? 0n) - (native?.locked ?? 0n);

  const isClaimReward = intent.mode === "claimReward";
  const amount = isClaimReward ? 0n : intent.amount;

  // Delegate spends amount + fees; other staking ops move staked funds, so only the fee is covered.
  const totalSpent = intent.mode === "delegate" ? amount + estimatedFees : estimatedFees;
  if (!isClaimReward && amount <= 0n) {
    errors.amount = new AmountRequired();
  } else if (totalSpent > available) {
    errors.amount = new NotEnoughBalance();
  }

  return { errors, warnings, estimatedFees, amount, totalSpent };
}
