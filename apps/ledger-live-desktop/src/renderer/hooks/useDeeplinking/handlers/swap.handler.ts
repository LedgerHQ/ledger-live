import { DeeplinkHandler } from "../types";

export const swapHandler: DeeplinkHandler<"swap"> = (route, { navigate }) => {
  const { amountFrom, fromToken, toToken, affiliate } = route;

  const state: {
    defaultToken?: { fromTokenId: string; toTokenId: string };
    defaultAmountFrom?: string;
    affiliate?: string;
  } = {};

  if (fromToken !== toToken) {
    state.defaultToken = { fromTokenId: fromToken, toTokenId: toToken };
  }

  if (amountFrom) {
    state.defaultAmountFrom = amountFrom;
  }

  if (affiliate) {
    state.affiliate = affiliate;
  }

  navigate("/swap", state);
};
