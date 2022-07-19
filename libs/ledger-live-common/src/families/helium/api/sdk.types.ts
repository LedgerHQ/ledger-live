import { Validator } from "@helium/http";
import BigNumber from "bignumber.js";

interface TxnCommon {
  type: string;
  time: number;
  height: number;
  hash: string;
}

interface PaymentV2Payment {
  payee: string;
  amount: number;
}

export interface PaymentV2 extends TxnCommon {
  payments: PaymentV2Payment[];
  payer: string;
  nonce: number;
  fee: number;
}

export interface PaymentV1 extends TxnCommon {
  payer: string;
  payee: string;
  amount: number;
  nonce: number;
  fee: number;
}

export interface StakeV1 extends TxnCommon {
  validatorAddress: string;
  amount: number;
  fee: number;
  nonce: number;
}

export interface UnstakeV1 extends TxnCommon {
  validatorAddress: string;
  amount: number;
  fee: number;
  nonce: number;
}

export interface TransferStakeV1 extends TxnCommon {
  oldValidatorAddress: string;
  newValidatorAddress: string;
  paymentAmount: number;
  fee: number;
  nonce: number;
  amount: number;
}

export interface BurnV1 extends TxnCommon {
  payee: string;
  memo: string;
  fee: number;
  nonce: number;
  amount: number;
}

export interface Account {
  stakedBalance: BigNumber;
  speculativeSecNonce: number;
  speculativeNonce: number;
  secNonce: number;
  secBalance: BigNumber;
  nonce: number;
  dcNonce: number;
  dcBalance: BigNumber;
  blockHeight: number;
  balance: BigNumber;
  address: string;
  validators: Validator[];
}

export interface AccountHTTP {
  staked_balance: number;
  speculative_sec_nonce: number;
  speculative_nonce: number;
  sec_nonce: number;
  sec_balance: number;
  nonce: number;
  dc_nonce: number;
  dc_balance: number;
  block: number;
  balance: number;
  address: string;
}
