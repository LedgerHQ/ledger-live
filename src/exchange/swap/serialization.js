// @flow

import { BigNumber } from "bignumber.js";
import type {
  Exchange,
  ExchangeRaw,
  ExchangeRate,
  ExchangeRateRaw,
} from "./types";
import {
  fromAccountLikeRaw,
  fromAccountRaw,
  toAccountLikeRaw,
  toAccountRaw,
} from "../../account";

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
  const {
    fromAccount,
    fromParentAccount,
    toAccount,
    toParentAccount,
  } = exchange;

  return {
    fromAccount: toAccountLikeRaw(fromAccount),
    fromParentAccount: fromParentAccount
      ? toAccountRaw(fromParentAccount)
      : null,
    toAccount: toAccountLikeRaw(toAccount),
    toParentAccount: toParentAccount ? toAccountRaw(toParentAccount) : null,
  };
};

export const toExchangeRateRaw = (
  exchangeRate: ExchangeRate
): ExchangeRateRaw => {
  const {
    rate,
    magnitudeAwareRate,
    rateId,
    provider,
    providerURL,
  } = exchangeRate;

  return {
    rate: rate.toString(),
    magnitudeAwareRate: magnitudeAwareRate.toString(),
    rateId,
    provider,
    providerURL,
  };
};

export const fromExchangeRateRaw = (
  exchangeRateRaw: ExchangeRateRaw
): ExchangeRate => {
  const {
    rate,
    magnitudeAwareRate,
    rateId,
    provider,
    providerURL,
  } = exchangeRateRaw;

  return {
    rate: new BigNumber(rate),
    magnitudeAwareRate: new BigNumber(magnitudeAwareRate),
    rateId,
    provider,
    providerURL,
  };
};
