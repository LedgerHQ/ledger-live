import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { DeeplinkHandler } from "../types";

export const swapHandler: DeeplinkHandler<"swap"> = (route, { navigate }) => {
  const {
    amountFrom,
    fromAccountId,
    fromToken,
    toToken,
    affiliate,
    fromPath,
    fromCurrency,
    toCurrency,
    toAccountId,
  } = route;

  const state: {
    defaultToken?: { fromTokenId?: string; toTokenId?: string };
    defaultCurrency?: { fromCurrencyId?: string; toCurrencyId?: string };
    defaultAmountFrom?: string;
    affiliate?: string;
    from?: string;
    defaultAccountId?: { fromAccountId?: string; toAccountId?: string };
  } = {};

  if (fromToken) {
    state.defaultToken = { fromTokenId: fromToken };
  }

  if (toToken) {
    state.defaultToken = { ...state.defaultToken, toTokenId: toToken };
  }

  if (toCurrency) {
    state.defaultCurrency = { toCurrencyId: toCurrency };
  }

  if (fromCurrency) {
    state.defaultCurrency = { ...state.defaultCurrency, fromCurrencyId: fromCurrency };
  }

  if (amountFrom) {
    state.defaultAmountFrom = amountFrom;
  }

  if (affiliate) {
    state.affiliate = affiliate;
  }

  if (fromPath) {
    state.from = fromPath;
  }

  // For deeplinks that arrive at cold start, the internal id map
  // may not be populated yet. In that case we forward the raw id as-is so the
  // swap screen can still attempt to resolve it (or pass it straight to the Live App).
  if (toAccountId) {
    const internalId = getAccountIdFromWalletAccountId(toAccountId);
    state.defaultAccountId = {
      toAccountId: internalId ?? toAccountId,
    };
  }

  if (fromAccountId) {
    const internalId = getAccountIdFromWalletAccountId(fromAccountId);
    state.defaultAccountId = {
      ...state.defaultAccountId,
      fromAccountId: internalId ?? fromAccountId,
    };
  }

  navigate("/swap", state);
};
