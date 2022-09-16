import type { BigNumber } from "bignumber.js";
import { types as TyphonTypes } from "@stricahq/typhonjs";
import type {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export enum PaymentChain {
  external = 0,
  internal = 1,
}

export enum StakeChain {
  stake = 2,
}

export enum NetworkId {
  testnet = 0,
  mainnet = 1,
}

export type BipPath = {
  purpose: number;
  coin: number;
  account: number;
  chain: PaymentChain | StakeChain;
  index: number;
};

export type BipPathRaw = {
  purpose: number;
  coin: number;
  account: number;
  chain: PaymentChain | StakeChain;
  index: number;
};

export type Token = {
  assetName: string;
  policyId: string;
  amount: BigNumber;
};

export type TokenRaw = {
  assetName: string;
  policyId: string;
  amount: string;
};

export type PaymentKeyPath = {
  key: string;
  path: BipPath;
};

export type PaymentCredential = {
  isUsed: boolean;
  key: string;
  path: BipPath;
};

export type PaymentCredentialRaw = {
  isUsed: boolean;
  key: string;
  path: BipPathRaw;
};

export type StakeCredential = {
  key: string;
  path: BipPath;
};

export type CardanoOutput = {
  hash: string;
  index: number;
  address: string;
  amount: BigNumber;
  tokens: Array<Token>;
  paymentCredential: {
    key: string;
    path: BipPath;
  };
};

export type CardanoOutputRaw = {
  hash: string;
  index: number;
  address: string;
  amount: string;
  tokens: Array<TokenRaw>;
  paymentCredential: {
    key: string;
    path: BipPath;
  };
};

export type ProtocolParams = {
  minFeeA: string;
  minFeeB: string;
  stakeKeyDeposit: string;
  lovelacePerUtxoWord: string;
  collateralPercent: string;
  priceSteps: string;
  priceMem: string;
  languageView: TyphonTypes.LanguageView;
};

export type ProtocolParamsRaw = {
  minFeeA: string;
  minFeeB: string;
  stakeKeyDeposit: string;
  lovelacePerUtxoWord: string;
  collateralPercent: string;
  priceSteps: string;
  priceMem: string;
  // TyphonTypes.LanguageView is already a raw type
  languageView: TyphonTypes.LanguageView;
};

/**
 * Cardano account resources
 */
export type CardanoResources = {
  externalCredentials: Array<PaymentCredential>;
  internalCredentials: Array<PaymentCredential>;
  utxos: Array<CardanoOutput>;
  protocolParams: ProtocolParams;
};

/**
 * Cardano account resources from raw JSON
 */
export type CardanoResourcesRaw = {
  externalCredentials: Array<PaymentCredentialRaw>;
  internalCredentials: Array<PaymentCredentialRaw>;
  utxos: Array<CardanoOutputRaw>;
  protocolParams: ProtocolParamsRaw;
};

/**
 * Cardano transaction
 */
export type Transaction = TransactionCommon & {
  mode: string;
  family: "cardano";
  fees?: BigNumber;
  memo?: string;
  // add here all transaction-specific fields if you implement other modes than "send"
};

/**
 * Cardano transaction from a raw JSON
 */
export type TransactionRaw = TransactionCommonRaw & {
  family: "cardano";
  mode: string;
  fees?: string;
  memo?: string;
  // also the transaction fields as raw JSON data
};

export type CardanoLikeNetworkParameters = {
  identifier: string;
  networkId: number;
  chainStartTime: number;
  byronSlotDuration: number;
  byronSlotsPerEpoch: number;
  shelleyStartEpoch: number;
  shelleySlotDuration: number;
  shelleySlotsPerEpoch: number;
  addressPrefix: string;
};

/**
 * Cardano currency data that will be preloaded.
 */
export type CardanoPreloadData = {
  protocolParams: ProtocolParams;
};

export type CardanoAccount = Account & { cardanoResources: CardanoResources };

export type CardanoAccountRaw = AccountRaw & {
  cardanoResources: CardanoResourcesRaw;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
