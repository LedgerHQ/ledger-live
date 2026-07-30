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
} from "@ledgerhq/ledger-wallet-framework/errors";
import cryptoFactory from "../../chain/chain";
import {
  ClaimRewardsFeesWarning,
  RedelegateDstValAddressRequired,
  ValAddressRequired,
} from "../../errors";
import { validateAddress } from "../validateAddress";

function clampPositive(value: bigint): bigint {
  return value > 0n ? value : 0n;
}

/**
 * Validate a transfer or staking intent in the Alpaca `TransactionValidation` shape. A leaner
 * reimplementation of the bridge `getTransactionStatus`, not a full mirror: it covers the core
 * recipient/amount/fee rules (plus `feeTooHigh` and claim-reward-fee warnings) but omits the
 * bridge's cosmosResources-based checks (delegation/redelegation/unbonding limits,
 * redelegation-in-progress) — the Alpaca inputs don't carry that data. Staking →
 * {@link validateStakingIntent}.
 */
export async function validateIntent(
  currencyId: string,
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  if (intent.intentType === "staking") {
    return validateStakingIntent(
      currencyId,
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
 * Validate a staking intent: the validator address must be present and carry the chain's valoper
 * prefix (and a destination validator for redelegate); `claimReward` carries no amount and must not
 * error on that. A claim/compound whose fee exceeds the reward being claimed raises `claimRewardsFee`.
 */
function validateStakingIntent(
  currencyId: string,
  intent: StakingTransactionIntent,
  balances: Balance[],
  estimatedFees: bigint,
): TransactionValidation {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const validatorPrefix = cryptoFactory(currencyId).validatorPrefix;

  if (!intent.valAddress) {
    errors.valAddress = new ValAddressRequired();
  } else if (!intent.valAddress.startsWith(validatorPrefix)) {
    errors.valAddress = new InvalidAddress();
  }
  if (intent.mode === "redelegate") {
    if (!intent.dstValAddress) {
      errors.dstValAddress = new RedelegateDstValAddressRequired();
    } else if (!intent.dstValAddress.startsWith(validatorPrefix)) {
      errors.dstValAddress = new InvalidAddress();
    }
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

  // The fee eats the reward: the bridge compares against pendingRewards, which the Alpaca inputs
  // don't carry — so, like coin-evm's validateIntent, compare the fee against the intent amount.
  if (
    (intent.mode === "claimReward" || intent.mode === "compoundReward") &&
    intent.amount > 0n &&
    estimatedFees > intent.amount
  ) {
    warnings.claimRewardsFee = new ClaimRewardsFeesWarning();
  }

  return { errors, warnings, estimatedFees, amount, totalSpent };
}
