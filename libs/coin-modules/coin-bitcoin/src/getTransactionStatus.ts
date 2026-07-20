import {
  AmountRequired,
  NotEnoughBalance,
  FeeNotLoaded,
  FeeTooHigh,
  FeeRequired,
  InvalidAddress,
} from "@ledgerhq/ledger-wallet-framework/errors";
import {
  DustLimit,
  FeeTooLow,
  OpReturnDataSizeLimit,
  TaprootNotActivated,
  ZcashSaplingRecipientNotSupported,
} from "./errors";
import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import type { Account, AccountBridge } from "@ledgerhq/types-live";
import type {
  BitcoinAccount,
  BitcoinInput,
  BitcoinOutput,
  Transaction,
  TransactionStatus,
} from "./types";
import { calculateFees, validateRecipient, isTaprootRecipient } from "./cache";
import { OP_RETURN_DATA_SIZE_LIMIT } from "./wallet-btc/crypto/base";
import cryptoFactory from "./wallet-btc/crypto/factory";
import { computeDustAmount } from "./wallet-btc/utils";
import { classifyZcashRecipient } from "./chain-adapters/zcash/address";
import { Currency } from "./wallet-btc";
import { isAddressSanctioned } from "@ledgerhq/ledger-wallet-framework/sanction/index";
import { AddressesSanctionedError } from "@ledgerhq/ledger-wallet-framework/sanction/errors";
import { getChainAdapter } from "./chain-adapters/registry";

export const MAX_BLOCK_HEIGHT_FOR_TAPROOT = 709632;

type ErrorMap = Record<string, Error>;

type FeeCalculation = {
  txInputs: BitcoinInput[];
  txOutputs: BitcoinOutput[];
  estimatedFees: BigNumber;
};

// Zcash shielded context: refine recipient validation only where the shared
// validator gets it wrong. Gated on "sender" in transaction so the flag-off /
// non-shielded path is unchanged. Returns whether the legacy Bitcoin fee
// calculation must be skipped (a valid Orchard UA the legacy builder can't encode).
//
// We only OVERRIDE validateRecipient's result for a private (Orchard UA)
// recipient. For transparent recipients we keep the shared result untouched:
// classifyZcashRecipient checks only the prefix + length (not the Base58Check
// checksum), so clearing errors here would let a malformed address slip through.
//
// NOTE: In the running app the Zcash chain adapter now handles the shielded
// flows ("shielded", "shielded-to-transparent", "transparent-to-shielded") in
// its own getTransactionStatus and short-circuits before this default path — so
// the private-recipient (skip) branch below is only reachable when the adapter
// is not registered. This refinement is still required for recipients that
// resolve to transferType "transparent" (Sapling/invalid UAs), which the adapter
// intentionally leaves to this legacy path, so it maps them to the precise error
// (ZcashSaplingRecipientNotSupported / InvalidAddress).
function refineZcashRecipient(
  account: Account,
  transaction: Transaction,
  errors: ErrorMap,
): boolean {
  const isZcashShielded =
    account.currency.id === "zcash" && "sender" in transaction && !!transaction.recipient;
  if (!isZcashShielded) return false;

  const cls = classifyZcashRecipient(transaction.recipient);
  if ("error" in cls) {
    errors.recipient =
      cls.error === "sapling-unsupported"
        ? new ZcashSaplingRecipientNotSupported()
        : new InvalidAddress("", { currencyName: account.currency.name });
    return false;
  }

  if (cls.recipientType === "private") {
    delete errors.recipient;
    return true;
  }

  return false;
}

async function validateRecipientAndChange(
  account: Account,
  transaction: Transaction,
  errors: ErrorMap,
  warnings: ErrorMap,
): Promise<boolean> {
  const { recipientError, recipientWarning, changeAddressError, changeAddressWarning } =
    await validateRecipient(account.currency, transaction.recipient, transaction?.changeAddress);

  if (recipientError) errors.recipient = recipientError;
  if (recipientWarning) warnings.recipient = recipientWarning;

  const skipLegacyFeeCalculation = refineZcashRecipient(account, transaction, errors);

  if (changeAddressError) errors.changeAddress = changeAddressError;
  if (changeAddressWarning) warnings.changeAddress = changeAddressWarning;

  return skipLegacyFeeCalculation;
}

// Safeguard before Taproot activation
async function applyTaprootSafeguard(
  account: Account,
  transaction: Transaction,
  errors: ErrorMap,
): Promise<void> {
  const applies =
    transaction.recipient &&
    !errors.recipient &&
    !errors.changeAddress &&
    account.currency.id === "bitcoin" &&
    account.blockHeight <= MAX_BLOCK_HEIGHT_FOR_TAPROOT;
  if (!applies) return;

  const isTaproot = await isTaprootRecipient(account.currency, transaction.recipient);
  const changeAddressIsTaproot = transaction.changeAddress
    ? await isTaprootRecipient(account.currency, transaction.changeAddress)
    : false;

  if (isTaproot) errors.recipient = new TaprootNotActivated();
  if (changeAddressIsTaproot) errors.changeAddress = new TaprootNotActivated();
}

function getRelayFeePerByte(account: Account, transaction: Transaction): BigNumber | undefined {
  const networkRelayFee = transaction.networkInfo?.relayFeePerByte;
  if (networkRelayFee && networkRelayFee.gt(0)) return networkRelayFee;
  return account.currency.id === "bitcoin" ? new BigNumber(1) : undefined;
}

async function computeFees(
  account: Account,
  transaction: Transaction,
  errors: ErrorMap,
  skipLegacyFeeCalculation: boolean,
): Promise<FeeCalculation> {
  const empty: FeeCalculation = {
    txInputs: [],
    txOutputs: [],
    estimatedFees: new BigNumber(0),
  };

  const relayFeePerByte = getRelayFeePerByte(account, transaction);

  if (!transaction.feePerByte) {
    errors.feePerByte = new FeeNotLoaded();
    return empty;
  }
  if (transaction.feePerByte.eq(0)) {
    errors.feePerByte = new FeeRequired();
    return empty;
  }
  if (relayFeePerByte && transaction.feePerByte.lt(relayFeePerByte)) {
    errors.feePerByte = new FeeTooLow();
    return empty;
  }
  if (!transaction.recipient || errors.recipient || skipLegacyFeeCalculation) {
    return empty;
  }

  try {
    const res = await calculateFees({ account, transaction });
    return {
      txInputs: res.txInputs,
      txOutputs: res.txOutputs,
      estimatedFees: res.fees,
    };
  } catch (error) {
    const err = error as Error;
    if (err.name === "NotEnoughBalance") errors.amount = err;
    else if (err.name === "DustLimit") errors.dustLimit = err;
    else if (err.name === "RbfBuildError") errors.replacement = err;
    else throw error;
    return empty;
  }
}

async function collectSanctionedInputs(
  account: Account,
  txInputs: BitcoinInput[],
): Promise<string[]> {
  const sanctionedAddresses: string[] = [];
  for (const input of txInputs) {
    if (input.address && (await isAddressSanctioned(account.currency, input.address))) {
      sanctionedAddresses.push(input.address);
    }
  }
  return sanctionedAddresses;
}

function checkDustLimit(
  account: Account,
  transaction: Transaction,
  amount: BigNumber,
  estimatedFees: BigNumber,
  errors: ErrorMap,
): void {
  if (!transaction.feePerByte || !transaction.feePerByte.gt(0)) return;

  const txSize = Math.ceil(estimatedFees.toNumber() / transaction.feePerByte.toNumber());
  const crypto = cryptoFactory(account.currency.id as Currency);
  const derivationMode = (account as BitcoinAccount).bitcoinResources?.walletAccount?.params
    .derivationMode;
  const dustAmount = computeDustAmount(crypto, txSize, {
    derivationMode,
    relayFeePerByteSatVb: transaction.networkInfo?.relayFeePerByte,
  });

  if (amount.gt(0) && amount.lt(dustAmount)) {
    errors.dustLimit = new DustLimit();
  }
}

export const getTransactionStatus: AccountBridge<
  Transaction,
  Account,
  TransactionStatus
>["getTransactionStatus"] = async (account: Account, transaction: Transaction) => {
  const adapter = getChainAdapter(account.currency.id);
  const custom = adapter.getTransactionStatus?.(account, transaction);
  if (custom) return custom;

  const errors: ErrorMap = {};
  const warnings: ErrorMap = {};
  const useAllAmount = !!transaction.useAllAmount;

  const skipLegacyFeeCalculation = await validateRecipientAndChange(
    account,
    transaction,
    errors,
    warnings,
  );

  await applyTaprootSafeguard(account, transaction, errors);

  const { txInputs, txOutputs, estimatedFees } = await computeFees(
    account,
    transaction,
    errors,
    skipLegacyFeeCalculation,
  );

  const sumOfInputs = txInputs.reduce((sum, input) => sum.plus(input.value ?? 0), new BigNumber(0));
  const sumOfChanges = txOutputs
    .filter(o => o.isChange)
    .reduce((sum, output) => sum.plus(output.value), new BigNumber(0));

  log("bitcoin", `${txInputs.length} inputs, sum: ${sumOfInputs.toString()}`);
  const sanctionedAddresses = await collectSanctionedInputs(account, txInputs);
  if (sanctionedAddresses.length > 0) {
    errors.sender = new AddressesSanctionedError("AddressesSanctionedError", {
      addresses: sanctionedAddresses,
    });
  }
  log("bitcoin", `${txOutputs.length} outputs, sum of changes: ${sumOfChanges.toString()}`);

  const totalSpent = sumOfInputs.minus(sumOfChanges);
  const amount = useAllAmount ? totalSpent.minus(estimatedFees) : transaction.amount;
  log("bitcoin", `totalSpent ${totalSpent.toString()} amount ${amount.toString()}`);

  // For RBF cancel transactions, we're sending the same amount as the original tx but to ourselves (change address)
  // The recipient is the change address, so the external amount is effectively cancelled
  const isRbfCancel =
    transaction.replaceTxId && transaction.recipient === transaction.changeAddress;

  if (!errors.amount && !amount.gt(0) && !isRbfCancel) {
    errors.amount = useAllAmount ? new NotEnoughBalance() : new AmountRequired();
  }

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  checkDustLimit(account, transaction, amount, estimatedFees, errors);

  const { opReturnData, changeAddress } = transaction;
  if (opReturnData && opReturnData.length > OP_RETURN_DATA_SIZE_LIMIT) {
    errors.opReturnSizeLimit = new OpReturnDataSizeLimit();
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    opReturnData: opReturnData?.toString(),
    totalSpent,
    txInputs,
    txOutputs,
    changeAddress,
  };
};

export default getTransactionStatus;
