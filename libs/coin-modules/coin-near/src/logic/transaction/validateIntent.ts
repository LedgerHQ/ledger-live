import type {
  Balance,
  FeeEstimation,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { BigNumber } from "bignumber.js";
import { NEW_ACCOUNT_SIZE, YOCTO_THRESHOLD_VARIATION } from "../../constants";
import {
  NearActivationFeeNotCovered,
  NearNewAccountWarning,
  NearNewNamedAccountError,
  NearNotEnoughAvailable,
  NearNotEnoughStaked,
  NearRecommendUnstake,
  NearStakingThresholdNotMet,
  NearUseAllAmountStakeWarning,
} from "../../errors";
import { fetchAccountDetails, getActionCosts } from "../../network";
import { pooledAmount } from "../staking/pooledAmount";
import { getYoctoThreshold, isImplicitAccount, isValidAddress } from "../../logic";
import { resolveTarget, type NearIntent } from "./craftTransaction";

const STAKING_MODES = new Set(["stake", "unstake", "withdraw"]);

/** Errors carry a human-readable amount, which their i18n message interpolates. */
function formatNear(value: BigNumber): string {
  return formatCurrencyUnit(getCryptoCurrencyById("near").units[0], value, { showCode: true });
}

/** Spendable native balance: the account total minus its non-spendable part (staking and reserve). */
function spendable(balances: Balance[]): bigint {
  const native = balances.find(b => b.asset.type === "native" && b.stake === undefined);

  return (native?.value ?? 0n) - (native?.locked ?? 0n);
}

type RecipientCheck = {
  error?: Error;
  warning?: Error;
  isNewAccount: boolean;
  /** Yocto cost of creating the recipient account, zero when the recipient is unusable. */
  storageCost: BigNumber;
  formattedStorageCost: string;
};

/** Whether the recipient is usable, and what creating it would cost if it does not exist yet. */
async function checkRecipient(intent: NearIntent): Promise<RecipientCheck> {
  const unusable = { isNewAccount: false, storageCost: new BigNumber(0), formattedStorageCost: "" };

  if (!intent.recipient) {
    return { ...unusable, error: new RecipientRequired() };
  }

  if (!isValidAddress(intent.recipient)) {
    const currencyName = getCryptoCurrencyById("near").name;
    return { ...unusable, error: new InvalidAddress("", { currencyName }) };
  }

  const { storageCost: costPerByte } = await getActionCosts();
  const storageCost = costPerByte.multipliedBy(NEW_ACCOUNT_SIZE);
  const formattedStorageCost = formatNear(storageCost);

  if (await fetchAccountDetails(intent.recipient)) {
    return { isNewAccount: false, storageCost, formattedStorageCost };
  }

  const found = { isNewAccount: true, storageCost, formattedStorageCost };

  // An implicit (hex) account is created by the transfer itself; a named account cannot be,
  // it has to exist first.
  if (isImplicitAccount(intent.recipient)) {
    const warning = new NearNewAccountWarning(undefined, {
      formattedNewAccountStorageCost: formattedStorageCost,
    });
    return { ...found, warning };
  }

  return { ...found, error: new NearNewNamedAccountError() };
}

async function validateSend(
  intent: NearIntent,
  balances: Balance[],
  estimatedFees: bigint,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const available = spendable(balances);
  const recipient = await checkRecipient(intent);

  if (recipient.error) {
    errors.recipient = recipient.error;
  }
  if (recipient.warning) {
    warnings.recipient = recipient.warning;
  }
  if (intent.sender === intent.recipient) {
    warnings.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  const maxAmount = available - estimatedFees > 0n ? available - estimatedFees : 0n;
  const amount = intent.useAllAmount ? maxAmount : intent.amount;
  const totalSpent = amount + estimatedFees;

  if (totalSpent > available) {
    errors.amount = new NotEnoughBalance();
  } else if (amount <= 0n && !intent.useAllAmount) {
    errors.amount = new AmountRequired();
  } else if (recipient.isNewAccount && amount < BigInt(recipient.storageCost.toFixed(0))) {
    errors.amount = new NearActivationFeeNotCovered(undefined, {
      formattedNewAccountStorageCost: recipient.formattedStorageCost,
    });
  }

  if (intent.useAllAmount && balances.some(b => b.stake !== undefined)) {
    warnings.amount = new NearRecommendUnstake();
  }

  return { errors, warnings, estimatedFees, amount, totalSpent };
}

/**
 * The most a staking operation can move. Unstaking and withdrawing move already-delegated funds, so
 * only the fee comes out of the liquid balance; staking spends it.
 */
async function maxStakingAmount(
  mode: string,
  balances: Balance[],
  sender: string,
  delegate: string,
  available: bigint,
  estimatedFees: bigint,
): Promise<bigint> {
  if (mode === "unstake" || mode === "withdraw") {
    return pooledAmount(mode, sender, delegate, balances);
  }

  const afterFees = available - estimatedFees;
  return afterFees > 0n ? afterFees : 0n;
}

async function validateStaking(
  intent: NearIntent,
  balances: Balance[],
  estimatedFees: bigint,
  mode: string,
  delegate: string,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const available = spendable(balances);
  const yoctoThreshold = getYoctoThreshold();
  const threshold = BigInt(yoctoThreshold.toFixed(0));

  const maxAmount = await maxStakingAmount(
    mode,
    balances,
    intent.sender,
    delegate,
    available,
    estimatedFees,
  );
  const amount = intent.useAllAmount ? maxAmount : intent.amount;
  const totalSpent = mode === "stake" ? amount + estimatedFees : estimatedFees;

  if (estimatedFees > available || (mode === "stake" && totalSpent > available)) {
    errors.amount = new NotEnoughBalance();
  } else if (amount < threshold) {
    // The node reports a staked amount a yoctoNEAR short of what was staked, so the displayed
    // threshold carries the same variation the account bridge adds.
    errors.amount = new NearStakingThresholdNotMet(undefined, {
      threshold: formatNear(yoctoThreshold.plus(YOCTO_THRESHOLD_VARIATION)),
    });
  } else if (mode === "unstake" && amount > maxAmount) {
    errors.amount = new NearNotEnoughStaked();
  } else if (mode === "withdraw" && amount > maxAmount) {
    errors.amount = new NearNotEnoughAvailable();
  }

  if (mode === "stake" && !errors.amount && intent.useAllAmount) {
    warnings.amount = new NearUseAllAmountStakeWarning();
  }

  return { errors, warnings, estimatedFees, amount, totalSpent };
}

/**
 * Validate an intent against the account's balances, mirroring the account bridge's rules for both
 * transfers and staking.
 */
export async function validateIntent(
  intent: NearIntent,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const estimatedFees = customFees?.value ?? 0n;
  const { mode, receiverId } = resolveTarget(intent);

  if (STAKING_MODES.has(mode)) {
    return validateStaking(intent, balances, estimatedFees, mode, receiverId);
  }

  return validateSend(intent, balances, estimatedFees);
}
