import type {
  Exchange,
  ExchangeRaw,
  ExchangeSell,
  ExchangeSellRaw,
  ExchangeSwap,
  ExchangeSwapRaw,
} from "./types";
import { fromAccountLikeRaw, fromAccountRaw, toAccountLikeRaw, toAccountRaw } from "../../account";

const isExchangeSwapRaw = (
  exchangeRaw: ExchangeSwapRaw | ExchangeSellRaw,
): exchangeRaw is ExchangeSwapRaw => {
  return (exchangeRaw as ExchangeSwapRaw).toAccount !== undefined;
};

const isExchangeSwap = (exchange: ExchangeSwap | ExchangeSell): exchange is ExchangeSwap => {
  return (exchange as ExchangeSwap).toAccount !== undefined;
};

export const fromExchangeRaw = (exchangeRaw: ExchangeRaw): Exchange => {
  const fromAccount = fromAccountLikeRaw(exchangeRaw.fromAccount);
  const fromParentAccount = exchangeRaw.fromParentAccount
    ? fromAccountRaw(exchangeRaw.fromParentAccount)
    : null;

  if (!isExchangeSwapRaw(exchangeRaw)) {
    return {
      fromAccount,
      fromParentAccount,
    };
  }

  const toAccount = fromAccountLikeRaw(exchangeRaw.toAccount);
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
  const fromAccount = toAccountLikeRaw(exchange.fromAccount);
  const fromParentAccount = exchange.fromParentAccount
    ? toAccountRaw(exchange.fromParentAccount)
    : null;

  if (!isExchangeSwap(exchange)) {
    return {
      fromAccount,
      fromParentAccount,
    };
  }

  const toAccount = toAccountLikeRaw(exchange.toAccount);
  const toParentAccount = exchange.toParentAccount ? toAccountRaw(exchange.toParentAccount) : null;

  return {
    fromAccount,
    fromParentAccount,
    toAccount,
    toParentAccount,
  };
};
