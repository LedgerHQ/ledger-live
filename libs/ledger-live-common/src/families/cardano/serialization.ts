import { BigNumber } from "bignumber.js";
import type {
  BipPath,
  BipPathRaw,
  CardanoAccount,
  CardanoAccountRaw,
  CardanoOutput,
  CardanoOutputRaw,
  CardanoResources,
  CardanoResourcesRaw,
  PaymentCredential,
  PaymentCredentialRaw,
  ProtocolParams,
  ProtocolParamsRaw,
  Token,
  TokenRaw,
} from "./types";
import { Account, AccountRaw } from "@ledgerhq/types-live";

function toTokenRaw({ assetName, policyId, amount }: Token): TokenRaw {
  return {
    assetName,
    policyId,
    amount: amount.toString(),
  };
}

function fromTokenRaw({ assetName, policyId, amount }: TokenRaw): Token {
  return {
    assetName,
    policyId,
    amount: new BigNumber(amount),
  };
}

function toBipPathRaw({
  purpose,
  coin,
  account,
  chain,
  index,
}: BipPath): BipPathRaw {
  return {
    purpose,
    coin,
    account,
    chain,
    index,
  };
}

function fromBipPathRaw({
  purpose,
  coin,
  account,
  chain,
  index,
}: BipPathRaw): BipPath {
  return {
    purpose,
    coin,
    account,
    chain,
    index,
  };
}

function toPaymentCredentialRaw(r: PaymentCredential): PaymentCredentialRaw {
  return {
    isUsed: r.isUsed,
    key: r.key,
    path: toBipPathRaw(r.path),
  };
}

function fromPaymentCredentialRaw(r: PaymentCredentialRaw): PaymentCredential {
  return {
    isUsed: r.isUsed,
    key: r.key,
    path: fromBipPathRaw(r.path),
  };
}

function toCardanoOutputRaw({
  hash,
  index,
  address,
  amount,
  tokens,
  paymentCredential,
}: CardanoOutput): CardanoOutputRaw {
  return {
    hash,
    index,
    address,
    amount: amount.toString(),
    tokens: tokens.map(toTokenRaw),
    paymentCredential,
  };
}

function fromCardanoOutputRaw({
  hash,
  index,
  address,
  amount,
  tokens,
  paymentCredential,
}: CardanoOutputRaw): CardanoOutput {
  return {
    hash,
    index,
    address,
    amount: new BigNumber(amount),
    tokens: tokens.map(fromTokenRaw),
    paymentCredential,
  };
}

function toProtocolParamsRaw({
  minFeeA,
  minFeeB,
  stakeKeyDeposit,
  lovelacePerUtxoWord,
  collateralPercent,
  priceSteps,
  priceMem,
  languageView,
}: ProtocolParams): ProtocolParamsRaw {
  return {
    minFeeA,
    minFeeB,
    stakeKeyDeposit,
    lovelacePerUtxoWord,
    collateralPercent,
    priceSteps,
    priceMem,
    languageView,
  };
}

function fromProtocolParamsRaw({
  minFeeA,
  minFeeB,
  stakeKeyDeposit,
  lovelacePerUtxoWord,
  collateralPercent,
  priceSteps,
  priceMem,
  languageView,
}: ProtocolParamsRaw): ProtocolParams {
  return {
    minFeeA,
    minFeeB,
    stakeKeyDeposit,
    lovelacePerUtxoWord,
    collateralPercent,
    priceSteps,
    priceMem,
    languageView,
  };
}

export function toCardanoResourceRaw(r: CardanoResources): CardanoResourcesRaw {
  return {
    internalCredentials: r.internalCredentials.map(toPaymentCredentialRaw),
    externalCredentials: r.externalCredentials.map(toPaymentCredentialRaw),
    utxos: r.utxos.map(toCardanoOutputRaw),
    protocolParams: toProtocolParamsRaw(r.protocolParams),
  };
}

export function fromCardanoResourceRaw(
  r: CardanoResourcesRaw
): CardanoResources {
  return {
    internalCredentials: r.internalCredentials.map(fromPaymentCredentialRaw),
    externalCredentials: r.externalCredentials.map(fromPaymentCredentialRaw),
    utxos: r.utxos.map(fromCardanoOutputRaw),
    protocolParams: fromProtocolParamsRaw(r.protocolParams),
  };
}

export function assignToAccountRaw(
  account: Account,
  accountRaw: AccountRaw
): void {
  const cardanoAccount = account as CardanoAccount;
  if (cardanoAccount.cardanoResources) {
    (accountRaw as CardanoAccountRaw).cardanoResources = toCardanoResourceRaw(
      cardanoAccount.cardanoResources
    );
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const cardanoResourcesRaw = (accountRaw as CardanoAccountRaw)
    .cardanoResources;
  if (cardanoResourcesRaw)
    (account as CardanoAccount).cardanoResources =
      fromCardanoResourceRaw(cardanoResourcesRaw);
}
