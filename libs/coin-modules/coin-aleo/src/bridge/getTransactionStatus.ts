import type { Account, AccountBridge } from "@ledgerhq/types-live";
import {
  AmountRequired,
  RecipientRequired,
  NotEnoughBalance,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/errors";
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
  isSelfTransferTransaction,
  isTokenTransaction,
  getAleoSubAccount,
  sumPrivateRecords,
} from "../logic/utils";
import aleoCoinConfig from "../config";
import {
  MAX_PRIVATE_RECORDS_PER_TRANSACTION,
  MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION,
  MIN_BOND_AMOUNT,
  MIN_STAKE_AMOUNT,
  TRANSACTION_TYPE,
} from "../constants";
import {
  AleoAmountRecordRequired,
  AleoAmountTooLargeForTransaction,
  AleoBondAmountTooLow,
  AleoClosedValidator,
  AleoStakeAmountTooLow,
  AleoFeeRecordInsufficientBalance,
  AleoFeeRecordRequired,
  AleoNoClaimableAmount,
  AleoTooManyRecordsSelected,
  AleoTwoRecordsRequired,
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
 * Bridge-level guard mirroring (and backstopping) the UI-only closed-validator
 * check in StepValidator.tsx: it derives `isOpen` from the fetched validator
 * list and disables the UI's Continue button, but that guard silently
 * disappears when the validator fetch fails and the UI falls back to a
 * free-text address input with an empty list. Re-checking here makes the
 * bridge — not the UI — authoritative, so a closed-validator bond is
 * rejected regardless of which UI path was used.
 *
 * The committee/latest response (fetched via getValidators) is the only
 * place `isOpen` is available; there is no single-address lookup. A
 * validator absent from the committee is not proven closed (it may be new,
 * or the metadata fetch may be incomplete) so it is not blocked here — an
 * invalid/unknown recipient is already caught by validateRecipient above.
 * A network failure while fetching the committee is treated the same way:
 * we do not hard-fail the status (that would block legitimate bonds during
 * an outage), we simply skip this check.
 */
async function validateBondValidatorIsOpen({
  account,
  recipient,
}: {
  account: Account;
  recipient: string;
}): Promise<Error | null> {
  try {
    const validators = await getValidators(account.currency);
    const validator = validators.find(({ address }) => address === recipient);

    if (validator && !validator.isOpen) {
      return new AleoClosedValidator();
    }
  } catch {
    // Unable to determine validator status (e.g. committee endpoint down):
    // do not block the bond on an unrelated outage.
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

  const isStakingSelfMode =
    transaction.mode === TRANSACTION_TYPE.UNBOND_PUBLIC ||
    transaction.mode === TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC;

  const recipientError = await validateRecipient({
    account,
    recipient: transaction.recipient,
    allowSelfTransfer: allowSelfTransfer || isStakingSelfMode,
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

    // Only worth checking once we know the recipient is a well-formed
    // address; an invalid/empty recipient is already reported above.
    if (!recipientError) {
      const closedValidatorError = await validateBondValidatorIsOpen({
        account,
        recipient: transaction.recipient,
      });
      if (closedValidatorError) {
        errors.recipient = closedValidatorError;
      }
    }
  }

  if (
    transaction.mode !== TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC &&
    !transaction.useAllAmount &&
    transaction.amount.lte(0)
  ) {
    errors.amount = new AmountRequired();
  } else if (
    transaction.mode === TRANSACTION_TYPE.BOND_PUBLIC &&
    calculatedAmount.amount.gt(0) &&
    calculatedAmount.amount.lt(MIN_BOND_AMOUNT)
  ) {
    errors.amount = new AleoBondAmountTooLow(undefined, {
      minAmount: formatCurrencyUnit(account.currency.units[0], new BigNumber(MIN_BOND_AMOUNT), {
        showCode: true,
      }),
    });
  } else if (
    transaction.mode === TRANSACTION_TYPE.BOND_PUBLIC &&
    calculatedAmount.amount.gt(0) &&
    // A delegator must have at least MIN_STAKE_AMOUNT bonded in total. Validate the
    // projected total stake (already-bonded balance + this bond amount), so top-ups
    // on an existing >= MIN_STAKE_AMOUNT position are allowed.
    (account.aleoResources?.bondedBalance ?? new BigNumber(0))
      .plus(calculatedAmount.amount)
      .lt(MIN_STAKE_AMOUNT)
  ) {
    errors.amount = new AleoStakeAmountTooLow(undefined, {
      minAmount: formatCurrencyUnit(account.currency.units[0], new BigNumber(MIN_STAKE_AMOUNT), {
        showCode: true,
      }),
    });
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

  if (transaction.mode === TRANSACTION_TYPE.UNBOND_PUBLIC) {
    // fee coverage is validated separately by validatePublicFees against the transparent balance
    if (calculatedAmount.amount.gt(availableBalance)) {
      errors.amount = new NotEnoughBalance();
    }
  } else if (transaction.mode === TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC) {
    if (availableBalance.lte(0)) {
      errors.amount = new AleoNoClaimableAmount();
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
