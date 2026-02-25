import { DeeplinkHandler } from "../types";

export const swapHandler: DeeplinkHandler<"swap"> = (route, { navigate }) => {
  const { amountFrom, fromToken, toToken, affiliate, fromPath, fromCurrency, toCurrency } = route;

  const state: {
    defaultToken?: { fromTokenId?: string; toTokenId?: string };
    defaultCurrency?: { fromCurrencyId?: string; toCurrencyId?: string };
    defaultAmountFrom?: string;
    affiliate?: string;
    from?: string;
    fromCurrency?: string;
    toCurrency?: string;
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

  navigate("/swap", state);
};
