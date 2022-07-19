import {
  PaymentV2,
  StakeValidatorV1,
  UnstakeValidatorV1,
  TransferValidatorStakeV1,
  TokenBurnV1,
} from "@helium/transactions";
import type {
  SendTransaction,
  StakeTransaction,
  Transaction,
  TransferStakeTransaction,
  BurnTransaction,
} from "./types";
import type { Account } from "../../types";
import { getNonce } from "./logic";
import Address from "@helium/address";
import { getFees } from "./api";
import BigNumber from "bignumber.js";

/**
 *
 * @param a account
 * @param t transaction
 * @returns PaymentV2 object
 */
export const buildPaymentV2Txn = async (
  a: Account,
  t: Transaction
): Promise<PaymentV2> => {
  const nonce = await getNonce(a.freshAddress, a.currency);
  const { dc } = await getFees("payment_v2", a.currency);
  const sendTransaction = t.model as SendTransaction;

  return new PaymentV2({
    payer: Address.fromB58(a.freshAddress),
    payments: [
      {
        payee: Address.fromB58(t.recipient),
        amount: t.amount.toNumber(),
        memo: sendTransaction.memo,
      },
    ],
    nonce,
    fee: dc.toNumber(),
  });
};

/**
 *
 * @param a
 * @param t
 * @returns
 */
export const buildStakeValidatorV1Txn = async (
  a: Account,
  t: Transaction
): Promise<StakeValidatorV1> => {
  const { dc } = await getFees("stake_v1", a.currency);
  const stakeTransaction = t.model as StakeTransaction;

  return new StakeValidatorV1({
    address: Address.fromB58(stakeTransaction.validatorAddress),
    owner: Address.fromB58(a.freshAddress),
    fee: dc.toNumber(),
    stake: t.amount.toNumber(),
  });
};

/**
 *
 * @param a
 * @param t
 * @returns
 */
export const buildUnstakeValidatorV1Txn = async (
  a: Account,
  t: Transaction
): Promise<UnstakeValidatorV1> => {
  const { dc } = await getFees("unstake_v1", a.currency);
  const stakeTransaction = t.model as StakeTransaction;

  return new UnstakeValidatorV1({
    address: Address.fromB58(stakeTransaction.validatorAddress),
    owner: Address.fromB58(a.freshAddress),
    fee: dc.toNumber(),
  });
};

/**
 *
 * @param a
 * @param t
 * @returns
 */
export const buildTransferValidatorStakeV1Txn = async (
  a: Account,
  t: Transaction
): Promise<TransferValidatorStakeV1> => {
  const { dc } = await getFees("transfer_stake_v1", a.currency);
  const transferTransaction = t.model as TransferStakeTransaction;

  return new TransferValidatorStakeV1({
    oldAddress: Address.fromB58(transferTransaction.oldValidatorAddress),
    newAddress: Address.fromB58(transferTransaction.newValidatorAddress),
    oldOwner: Address.fromB58(a.freshAddress),
    newOwner: Address.fromB58(a.freshAddress),
    stakeAmount: t.amount.toNumber(),
    paymentAmount: new BigNumber(transferTransaction.paymentAmount).toNumber(),
    fee: dc.toNumber(),
  });
};

/**
 *
 * @param a account
 * @param t
 * @returns
 */
export const buildBurnTransactionV1Txn = async (
  a: Account,
  t: Transaction
): Promise<TokenBurnV1> => {
  const nonce = await getNonce(a.freshAddress, a.currency);
  const { dc } = await getFees("token_burn_v1", a.currency);
  const burnTransaction = t.model as BurnTransaction;

  return new TokenBurnV1({
    payer: Address.fromB58(a.freshAddress),
    payee: Address.fromB58(burnTransaction.payee),
    amount: t.amount.toNumber(),
    nonce,
    memo: burnTransaction.memo,
    fee: dc.toNumber(),
  });
};
