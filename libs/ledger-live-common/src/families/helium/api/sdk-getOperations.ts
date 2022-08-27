import BigNumber from "bignumber.js";
import {
  PaymentV1,
  PaymentV2,
  StakeV1,
  UnstakeV1,
  TransferStakeV1,
  BurnV1,
} from "./sdk.types";
import { fetch, fetchAll } from "./sdk";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import { endpointByCurrencyId } from "../utils";
import { dcToHnt } from "./sdk-getFees";

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
const parseTxn = async (
  txn: any,
  accountAddress: string,
  currency: CryptoCurrency
) => {
  switch (txn.type) {
    case "payment_v1":
      return await parsePaymentV1(txn, accountAddress, currency);
    case "payment_v2":
      return await parsePaymentV2(txn, accountAddress, currency);
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
const parsePaymentV1 = async (
  txn: PaymentV1,
  accountAddress: string,
  currency: CryptoCurrency
) => {
  const fee = await dcToHnt(new BigNumber(txn.fee), currency);
  return {
    id: txn.hash,
    hash: txn.hash,
    type: txn.payer === accountAddress ? "OUT" : "IN",
    value: new BigNumber(txn.amount),
    fee: fee,
    senders: [txn.payer],
    recipients: [txn.payee],
    blockHeight: txn.height,
    blockHash: txn.height.toString(),
    transactionSequenceNumber: txn.nonce,
    accountId: accountAddress,
    date: new Date(txn.time * 1000),
    extra: {
      tokenId: "hnt",
    },
  };
};

/**
 * Parse PaymentV2 Transaction.
 * @param txn transaction
 * @param accountAddress address making transaction
 * @returns transaction object.
 */
const parsePaymentV2 = async (
  txn: PaymentV2,
  accountAddress: string,
  currency: CryptoCurrency
) => {
  const fee = await dcToHnt(new BigNumber(txn.fee), currency);

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
    fee: fee,
    senders: [txn.payer],
    recipients: txn.payments.map((p) => p.payee),
    blockHeight: txn.height,
    blockHash: txn.height.toString(),
    transactionSequenceNumber: txn.nonce,
    accountId: accountAddress,
    date: new Date(txn.time * 1000),
    extra: {
      tokenId: txn.payments[0].token_type || "hnt",
    },
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
    extra: {
      tokenId: "hnt",
    },
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
    extra: {
      tokenId: "hnt",
    },
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
    extra: {
      tokenId: "hnt",
    },
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
    type: "BURN",
    value: new BigNumber(txn.amount),
    fee: new BigNumber(txn.fee), // TODO convert DC to HNT
    senders: [accountAddress],
    recipients: [txn.payee],
    blockHeight: txn.height,
    blockHash: txn.height.toString(),
    transactionSequenceNumber: txn.nonce,
    accountId: accountAddress,
    date: new Date(txn.time * 1000),
    extra: {
      tokenId: "hnt",
    },
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
  const txns = await fetchAll(`${rootUrl}/accounts/${address}/roles`, {
    filter_types: supportedTypes.join(","),
  });

  const promises = txns.map(async (role) => {
    const { data: txn } = await fetch(`${rootUrl}/transactions/${role.hash}`);
    return await parseTxn(txn, address, currency);
  });

  return Promise.all(promises);
};

export default getOperations;
