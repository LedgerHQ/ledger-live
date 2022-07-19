import BigNumber from "bignumber.js";
import {
  PaymentV1,
  PaymentV2,
  StakeV1,
  UnstakeV1,
  TransferStakeV1,
  BurnV1,
} from "./sdk.types";
import { fetchAll } from "./sdk";
import { CryptoCurrency, Operation } from "../../../types";
import { endpointByCurrencyId } from "../utils";

const supportedTypes = [
  "payment_v1",
  "payment_v2",
  "stake_validator_v1",
  "unstake_validator_v1",
  "transfer_validator_stake_v1",
  "token_burn_v1",
];

/**
 * Parse thorugh transaction.
 * @param txn transaction
 * @param accountAddress address making transaction
 * @returns
 */
const parseTxn = (txn: any, accountAddress: string) => {
  switch (txn.type) {
    case "payment_v1":
      return parsePaymentV1(txn, accountAddress);
    case "payment_v2":
      return parsePaymentV2(txn, accountAddress);
    case "stake_validator_v1":
      return parseStakeValidatorV1(txn, accountAddress);
    case "unstake_validator_v1":
      return parseUnstakeValidatorV1(txn, accountAddress);
    case "transfer_validator_stake_v1":
      return parseTransferValidatorStakeV1(txn, accountAddress);
    case "token_burn_v1":
      return parseBurnV1(txn, accountAddress);

    default:
      throw new Error("Unknown txn type");
  }
};

/**
 * Sums up all big numbers.
 * @param numbers
 * @returns sum of all numbers.
 */
const bigNumberSum = (numbers: BigNumber[]) =>
  numbers.reduce((sum, number) => sum.plus(number), new BigNumber(0));

/**
 * Parse PaymentV1 Transaction.
 * @param txn transaction
 * @param accountAddress address making transaction
 * @returns transaction object.
 */
const parsePaymentV1 = (txn: PaymentV1, accountAddress: string) => {
  return {
    id: txn.hash,
    hash: txn.hash,
    type: txn.payer === accountAddress ? "OUT" : "IN",
    value: new BigNumber(txn.amount),
    fee: new BigNumber(txn.fee), // TODO convert DC to HNT
    senders: [txn.payer],
    recipients: [txn.payee],
    blockHeight: txn.height,
    blockHash: txn.height.toString(),
    transactionSequenceNumber: txn.nonce,
    accountId: accountAddress,
    date: new Date(txn.time * 1000),
    extra: {},
  };
};

/**
 * Parse PaymentV2 Transaction.
 * @param txn transaction
 * @param accountAddress address making transaction
 * @returns transaction object.
 */
const parsePaymentV2 = (txn: PaymentV2, accountAddress: string) => {
  const bnPayments = txn.payments.map((p) => ({
    ...p,
    amount: new BigNumber(p.amount),
  }));

  return {
    id: txn.hash,
    hash: txn.hash,
    type: txn.payer === accountAddress ? "OUT" : "IN",
    value:
      txn.payer === accountAddress
        ? bigNumberSum(bnPayments.map((p) => p.amount))
        : bnPayments.find((p) => p.payee === accountAddress)?.amount,
    fee: new BigNumber(txn.fee), // TODO convert DC to HNT
    senders: [txn.payer],
    recipients: txn.payments.map((p) => p.payee),
    blockHeight: txn.height,
    blockHash: txn.height.toString(),
    transactionSequenceNumber: txn.nonce,
    accountId: accountAddress,
    date: new Date(txn.time * 1000),
    extra: {},
  };
};

/**
 *
 * @param txn `
 * @param accountAddress address making transaction
 * @returns transaction object.
 */
const parseStakeValidatorV1 = (txn: StakeV1, accountAddress: string) => {
  return {
    id: txn.hash,
    hash: txn.hash,
    type: "DELEGATE",
    value: new BigNumber(txn.amount),
    fee: new BigNumber(txn.fee), // TODO convert DC to HNT
    senders: [accountAddress],
    recipients: [txn.validatorAddress],
    blockHeight: txn.height,
    blockHash: txn.height.toString(),
    transactionSequenceNumber: txn.nonce,
    accountId: accountAddress,
    date: new Date(txn.time * 1000),
    extra: {},
  };
};

/**
 *
 * @param txn `
 * @param accountAddress address making transaction
 * @returns transaction object.
 */
const parseUnstakeValidatorV1 = (txn: UnstakeV1, accountAddress: string) => {
  return {
    id: txn.hash,
    hash: txn.hash,
    type: "UNDELEGATE",
    value: new BigNumber(txn.amount),
    fee: new BigNumber(txn.fee), // TODO convert DC to HNT
    senders: [accountAddress],
    recipients: [txn.validatorAddress],
    blockHeight: txn.height,
    blockHash: txn.height.toString(),
    transactionSequenceNumber: txn.nonce,
    accountId: accountAddress,
    date: new Date(txn.time * 1000),
    extra: {},
  };
};

/**
 *
 * @param txn `
 * @param accountAddress address making transaction
 * @returns transaction object.
 */
const parseTransferValidatorStakeV1 = (
  txn: TransferStakeV1,
  accountAddress: string
) => {
  return {
    id: txn.hash,
    hash: txn.hash,
    type: "DELEGATE",
    value: new BigNumber(txn.amount),
    fee: new BigNumber(txn.fee), // TODO convert DC to HNT
    senders: [txn.oldValidatorAddress],
    recipients: [txn.newValidatorAddress],
    blockHeight: txn.height,
    blockHash: txn.height.toString(),
    transactionSequenceNumber: txn.nonce,
    accountId: accountAddress,
    date: new Date(txn.time * 1000),
    extra: {},
  };
};

/**
 * Parse BurnV1 Transaction.
 * @param txn transaction
 * @param accountAddress address making transaction
 * @returns transaction object.
 */
const parseBurnV1 = (txn: BurnV1, accountAddress: string) => {
  return {
    id: txn.hash,
    hash: txn.hash,
    type: "VOTE",
    value: new BigNumber(txn.amount),
    fee: new BigNumber(txn.fee), // TODO convert DC to HNT
    senders: [accountAddress],
    recipients: [txn.payee],
    blockHeight: txn.height,
    blockHash: txn.height.toString(),
    transactionSequenceNumber: txn.nonce,
    accountId: accountAddress,
    date: new Date(txn.time * 1000),
    extra: {},
  };
};

/**
 * Return all operations.
 * @param address
 * @param currency currency of transaction.
 * @returns Promise with array of operations
 */
const getOperations = async (
  address: string,
  currency: CryptoCurrency
): Promise<Operation[]> => {
  const rootUrl = endpointByCurrencyId(currency.id);
  // Get all transactions in order to return operations.
  const txns = await fetchAll(`${rootUrl}/accounts/${address}/activity`, {
    filter_types: supportedTypes.join(","),
  });

  return txns.map((txn) => parseTxn(txn, address));
};

export default getOperations;
