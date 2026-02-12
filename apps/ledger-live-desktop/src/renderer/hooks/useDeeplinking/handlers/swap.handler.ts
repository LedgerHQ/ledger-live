import { DeeplinkHandler } from "../types";

export const swapHandler: DeeplinkHandler<"swap"> = (route, { navigate }) => {
  const { amountFrom, fromToken, toToken, affiliate, fromPath } = route;

  const state: {
    defaultToken?: { fromTokenId?: string; toTokenId?: string };
    defaultAmountFrom?: string;
    affiliate?: string;
    from?: string;
  } = {};

  if (fromToken) {
    state.defaultToken = { fromTokenId: fromToken };
  }

  if (toToken) {
    state.defaultToken = { ...state.defaultToken, toTokenId: toToken };
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
