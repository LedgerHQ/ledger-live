import type { Account, AccountBridge } from "@ledgerhq/types-live";
import {
  AmountRequired,
  RecipientRequired,
  NotEnoughBalance,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import invariant from "invariant";
import type {
  AleoAccount,
  Transaction as AleoTransaction,
  TransactionPrivate,
  TransactionStatus as AleoTransactionStatus,
  TransactionSelfTransfer,
  TransactionTransfer,
  AleoCoinConfig,
} from "../types";
import type { AleoUnspentRecord } from "../types/logic";
import { estimateFees, getValidators, validateAddress } from "../logic";
import {
  calculateAmount,
  getAvailableBalance,
  getRecordByCommitment,
  isPrivateTransaction,
  isSelfStakingMode,
  isSelfTransferTransaction,
  isTokenTransaction,
  getAleoSubAccount,
  sumPrivateRecords,
} from "../logic/utils";
import aleoCoinConfig from "../config";
import {
  MAX_PRIVATE_RECORDS_PER_TRANSACTION,
  MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION,
  MIN_BOND_AMOUNT_MICROCREDITS,
  MIN_DELEGATOR_STAKE_MICROCREDITS,
  TRANSACTION_TYPE,
} from "../constants";
import {
  AleoAlreadyBondedElsewhere,
  AleoAmountRecordRequired,
  AleoAmountTooLargeForTransaction,
  AleoBondAmountTooLow,
  AleoClosedValidator,
  AleoFeeRecordInsufficientBalance,
  AleoFeeRecordRequired,
  AleoNoClaimableUnbondedFunds,
  AleoStakeAmountTooLow,
  AleoTooManyRecordsSelected,
  AleoTwoRecordsRequired,
  AleoUnbondingValidator,
} from "../errors";

type Errors = Record<string, Error>;
type Warnings = Record<string, Error>;

/**
 * Resolve the amount records for a private transaction.
 * @param account - The Aleo account.
 * @param transaction - The Aleo transaction.
 * @returns The amount records.
 */
function resolveAmountRecords(account: AleoAccount, transaction: TransactionPrivate) {
  const isTokenTx = isTokenTransaction(transaction);
  const tokenAccount = getAleoSubAccount(account, transaction.subAccountId);

  if (isTokenTx) {
    invariant(tokenAccount, `aleo: tokenAccount is missing (${transaction.subAccountId})`);
  }

  const maxRecords = isTokenTx
    ? MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION
    : MAX_PRIVATE_RECORDS_PER_TRANSACTION;

  const records = transaction.properties.amountRecordCommitments
    .map(commitment =>
      getRecordByCommitment({
        account,
        commitment,
        ...(isTokenTx && tokenAccount && { tokenAccount }),
      }),
    )
    .filter((record): record is AleoUnspentRecord => record !== null);

  const totalValue = sumPrivateRecords(records);

  const privateBalance = isTokenTx
    ? (tokenAccount?.privateBalance ?? new BigNumber(0))
    : (account.aleoResources?.privateBalance ?? new BigNumber(0));

  return {
    records,
    totalValue,
    privateBalance,
    maxRecords,
  };
}

/**
 * Returns the appropriate error when auto-picking selected no records, possible reasons are:
 * - no private balance (no records)
 * - insufficient balance to cover given amount
 * - more than MAX_PRIVATE_RECORDS_PER_TRANSACTION records would be needed to cover the amount
 */
function resolveAutoPickingAmountError(amount: BigNumber, privateBalance: BigNumber): Error {
  if (privateBalance.isZero() || amount.gt(privateBalance)) {
    return new NotEnoughBalance();
  }

  return new AleoAmountTooLargeForTransaction();
}

/**
 * Validation rules with fee sponsorship:
 *  - amount record must be valid and have sufficient balance to cover amount
 *  - fee record can be ignored as fees are not paid by the user
 * Validation rules without fee sponsorship:
 *  - amount record must be valid and have sufficient balance to cover amount
 *  - fee record must be valid, different from the amount record and have sufficient balance to cover fees
 */
function validatePrivateTransaction({
  account,
  transaction,
  amount,
  estimatedFees,
  config,
}: {
  account: AleoAccount;
  transaction: TransactionPrivate;
  amount: BigNumber;
  estimatedFees: BigNumber;
  config: AleoCoinConfig;
}): Errors {
  const errors: Errors = {};
  const { records, totalValue, privateBalance, maxRecords } = resolveAmountRecords(
    account,
    transaction,
  );

  if (config.recordPickingStrategy === "manual" && records.length === 0) {
    errors.amountRecord = new AleoAmountRecordRequired();
  } else if (config.recordPickingStrategy === "auto" && records.length === 0) {
    errors.amount = resolveAutoPickingAmountError(amount, privateBalance);
  } else if (records.length > maxRecords) {
    errors.amount = new AleoTooManyRecordsSelected(undefined, { count: maxRecords });
  } else if (amount.gt(totalValue)) {
    errors.amount = new NotEnoughBalance();
  }

  if (config.isFeeSponsored) {
    return errors;
  }

  return {
    ...errors,
    ...validatePrivateFeeRecord({ account, transaction, estimatedFees }),
  };
}

/**
 * Fee is always paid in ALEO credits, even for token transactions.
 * Requires a valid fee record, distinct from amount records (native txs only), with enough balance.
 */
function validatePrivateFeeRecord({
  account,
  transaction,
  estimatedFees,
}: {
  account: AleoAccount;
  transaction: TransactionPrivate;
  estimatedFees: BigNumber;
}): Errors {
  const errors: Errors = {};
  const { feeRecordCommitment } = transaction.properties;
  const feeRecord = feeRecordCommitment
    ? getRecordByCommitment({ account, commitment: feeRecordCommitment })
    : null;
  const availableNativeRecords = (account.aleoResources?.unspentPrivateRecords ?? []).filter(
    record => new BigNumber(record.microcredits).isGreaterThan(0),
  );

  // Token transactions only need 1 native record for the fee (amount records come from the token pool).
  if (!isTokenTransaction(transaction) && availableNativeRecords.length <= 1) {
    errors.feeRecord = new AleoTwoRecordsRequired();
    return errors;
  }

  const feeRecordMatchesAmountRecord =
    !isTokenTransaction(transaction) &&
    !!feeRecord &&
    transaction.properties.amountRecordCommitments.includes(feeRecord.commitment);

  if (!feeRecord || feeRecordMatchesAmountRecord) {
    errors.feeRecord = new AleoFeeRecordRequired();
    return errors;
  }

  if (estimatedFees.gt(new BigNumber(feeRecord.microcredits))) {
    errors.feeRecord = new AleoFeeRecordInsufficientBalance();
  }

  return errors;
}

async function validateRecipient({
  account,
  recipient,
  allowSelfTransfer,
}: {
  account: Account;
  recipient: string;
  allowSelfTransfer: boolean;
}): Promise<Error | null> {
  if (!recipient || recipient.length === 0) {
    return new RecipientRequired();
  }

  const isValidRecipient = await validateAddress(recipient, {});

  if (!isValidRecipient) {
    return new InvalidAddress("", { currencyName: account.currency.name });
  }

  if (!allowSelfTransfer && account.freshAddress === recipient) {
    return new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  return null;
}

/**
 * A validator absent from the committee, or a committee that cannot be fetched at all,
 * deliberately passes: `isOpen` only exists in the committee response, and an outage must not
 * block a legitimate bond.
 */
async function validateBondRecipient({
  account,
  recipient,
}: {
  account: AleoAccount;
  recipient: string;
}): Promise<Error | null> {
  // credits.aleo rejects a bond to any validator other than the one already bonded.
  const bondedValidator = account.aleoResources?.bondedValidator;
  if (bondedValidator && bondedValidator !== recipient) {
    return new AleoAlreadyBondedElsewhere(undefined, { bondedValidator });
  }

  try {
    const validators = await getValidators(account.currency.id);
    const validator = validators.find(({ address }) => address === recipient);

    if (!validator) return null;
    if (validator.isUnbonding) return new AleoUnbondingValidator();
    if (!validator.isOpen) return new AleoClosedValidator();

    return null;
  } catch {
    return null;
  }
}

/**
 * The delegator floor is checked against the *projected* position, so a top-up on a stake that
 * already clears it passes.
 */
function validateStakingAmount({
  account,
  transaction,
  amount,
}: {
  account: AleoAccount;
  transaction: TransactionSelfTransfer | TransactionTransfer;
  amount: BigNumber;
}): Error | null {
  if (
    transaction.mode !== TRANSACTION_TYPE.BOND_PUBLIC &&
    transaction.mode !== TRANSACTION_TYPE.UNBOND_PUBLIC
  ) {
    return null;
  }

  // Neither mode has a downstream zero check the way a transfer does, and `useAllAmount` skips
  // the generic guard on `transaction.amount`.
  if (amount.lte(0)) {
    return new AmountRequired();
  }

  if (transaction.mode !== TRANSACTION_TYPE.BOND_PUBLIC) {
    return null;
  }

  const formatAmount = (value: number) =>
    formatCurrencyUnit(account.currency.units[0], new BigNumber(value), { showCode: true });

  if (amount.lt(MIN_BOND_AMOUNT_MICROCREDITS)) {
    return new AleoBondAmountTooLow(undefined, {
      minAmount: formatAmount(MIN_BOND_AMOUNT_MICROCREDITS),
    });
  }

  const bondedBalance = account.aleoResources?.bondedBalance ?? new BigNumber(0);
  if (bondedBalance.plus(amount).lt(MIN_DELEGATOR_STAKE_MICROCREDITS)) {
    return new AleoStakeAmountTooLow(undefined, {
      minAmount: formatAmount(MIN_DELEGATOR_STAKE_MICROCREDITS),
    });
  }

  return null;
}

function validatePublicFees({
  account,
  transaction,
  config,
  estimatedFees,
}: {
  account: AleoAccount;
  transaction: TransactionSelfTransfer | TransactionTransfer;
  config: AleoCoinConfig;
  estimatedFees: BigNumber;
}): Errors {
  const errors: Errors = {};

  if (config.isFeeSponsored || isPrivateTransaction(transaction)) {
    return errors;
  }

  const transparentBalance = account.aleoResources?.transparentBalance ?? new BigNumber(0);

  if (transparentBalance.lt(estimatedFees)) {
    errors.fees = new NotEnoughBalance();
    return errors;
  }

  return errors;
}

async function handleTransferTransaction({
  account,
  transaction,
  allowSelfTransfer,
}: {
  account: AleoAccount;
  transaction: TransactionSelfTransfer | TransactionTransfer;
  allowSelfTransfer: boolean;
}): Promise<AleoTransactionStatus> {
  const config = aleoCoinConfig.getCoinConfig(account.currency.id);
  const transactionType = transaction.mode;
  const feeEstimation = estimateFees({ configOrCurrencyId: config, transactionType });
  const estimatedFees = new BigNumber(feeEstimation.value.toString());
  const calculatedAmount = calculateAmount({ transaction, account, estimatedFees });
  const availableBalance = getAvailableBalance(account, transaction);

  const errors: Errors = {};
  const warnings: Warnings = {};

  const recipientError = await validateRecipient({
    account,
    recipient: transaction.recipient,
    allowSelfTransfer: allowSelfTransfer || isSelfStakingMode(transaction),
  });

  if (recipientError) {
    errors.recipient = recipientError;
  }

  if (transaction.mode === TRANSACTION_TYPE.BOND_PUBLIC) {
    const withdrawalError = await validateRecipient({
      account,
      recipient: transaction.withdrawal,
      allowSelfTransfer: true,
    });
    if (withdrawalError) {
      errors.withdrawal = withdrawalError;
    }

    if (!recipientError) {
      const bondRecipientError = await validateBondRecipient({
        account,
        recipient: transaction.recipient,
      });
      if (bondRecipientError) {
        errors.recipient = bondRecipientError;
      }
    }
  }

  // A claim signs no amount, so the generic zero guard would reject every one of them.
  if (
    transaction.mode !== TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC &&
    !transaction.useAllAmount &&
    transaction.amount.lte(0)
  ) {
    errors.amount = new AmountRequired();
  } else {
    const stakingAmountError = validateStakingAmount({
      account,
      transaction,
      amount: calculatedAmount.amount,
    });
    if (stakingAmountError) {
      errors.amount = stakingAmountError;
    }
  }

  if (isPrivateTransaction(transaction)) {
    Object.assign(
      errors,
      validatePrivateTransaction({
        account,
        transaction,
        amount: calculatedAmount.amount,
        estimatedFees,
        config,
      }),
    );
  }

  Object.assign(errors, validatePublicFees({ account, transaction, config, estimatedFees }));

  if (transaction.mode === TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC) {
    // Nothing to compare against — only whether anything has matured.
    if (availableBalance.lte(0)) {
      errors.amount = new AleoNoClaimableUnbondedFunds();
    }
  } else if (availableBalance.isLessThan(calculatedAmount.totalSpent)) {
    errors.amount = new NotEnoughBalance();
  }

  return {
    amount: calculatedAmount.amount,
    totalSpent: calculatedAmount.totalSpent,
    estimatedFees,
    errors,
    warnings,
  };
}

export const getTransactionStatus: AccountBridge<
  AleoTransaction,
  AleoAccount,
  AleoTransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const allowSelfTransfer = isSelfTransferTransaction(transaction);

  return handleTransferTransaction({
    account,
    transaction,
    allowSelfTransfer,
  });
};
