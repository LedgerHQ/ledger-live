import { BigNumber } from "bignumber.js";
import type { Exchange, ExchangeRaw, ExchangeRate, ExchangeRateRaw } from "./types";
import { fromAccountLikeRaw, fromAccountRaw, toAccountLikeRaw, toAccountRaw } from "../../account";
import { deserializeError, serializeError } from "@ledgerhq/errors";

export const fromExchangeRaw = (exchangeRaw: ExchangeRaw): Exchange => {
  const fromAccount = fromAccountLikeRaw(exchangeRaw.fromAccount);
  const toAccount = fromAccountLikeRaw(exchangeRaw.toAccount);
  const fromParentAccount = exchangeRaw.fromParentAccount
    ? fromAccountRaw(exchangeRaw.fromParentAccount)
    : null;
  const toParentAccount = exchangeRaw.toParentAccount
    ? fromAccountRaw(exchangeRaw.toParentAccount)
    : null;
  return {
    fromAccount,
    fromParentAccount,
    toAccount,
    toParentAccount,
  };
};

export const toExchangeRaw = (exchange: Exchange): ExchangeRaw => {
  const { fromAccount, fromParentAccount, toAccount, toParentAccount } = exchange;
  return {
    fromAccount: toAccountLikeRaw(fromAccount),
    fromParentAccount: fromParentAccount ? toAccountRaw(fromParentAccount) : null,
    toAccount: toAccountLikeRaw(toAccount),
    toParentAccount: toParentAccount ? toAccountRaw(toParentAccount) : null,
  };
};

export const toExchangeRateRaw = (exchangeRate: ExchangeRate): ExchangeRateRaw => {
  const {
    rate,
    magnitudeAwareRate,
    payoutNetworkFees,
    toAmount,
    rateId,
    provider,
    providerType,
    providerURL,
    tradeMethod,
    error,
  } = exchangeRate;

  if (!rate) {
    throw new Error("rate is required");
  }

  return {
    rate: rate.toString(),
    magnitudeAwareRate: magnitudeAwareRate.toString(),
    payoutNetworkFees: payoutNetworkFees ? payoutNetworkFees.toString() : "",
    toAmount: toAmount.toString(),
    rateId,
    provider,
    providerType,
    providerURL,
    tradeMethod,
    error: error ? JSON.stringify(serializeError(error)) : undefined,
  };
};

export const fromExchangeRateRaw = (exchangeRateRaw: ExchangeRateRaw): ExchangeRate => {
  const {
    rate,
    magnitudeAwareRate,
    payoutNetworkFees,
    toAmount,
    rateId,
    provider,
    providerType,
    providerURL,
    tradeMethod,
    error,
  } = exchangeRateRaw;
  return {
    rate: new BigNumber(rate),
    magnitudeAwareRate: new BigNumber(magnitudeAwareRate),
    payoutNetworkFees: payoutNetworkFees ? new BigNumber(payoutNetworkFees) : undefined,
    toAmount: new BigNumber(toAmount),
    rateId,
    provider,
    providerType,
    providerURL,
    tradeMethod,
    error: error ? deserializeError(JSON.parse(error)) : undefined,
  };
};
