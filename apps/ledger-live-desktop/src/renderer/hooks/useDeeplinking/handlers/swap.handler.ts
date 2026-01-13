import { DeeplinkHandler } from "../types";

interface SwapState {
  [k: string]: string | object | undefined;
  defaultToken?: { fromTokenId: string; toTokenId: string };
  defaultAmountFrom?: string;
  affiliate?: string;
}

export const swapHandler: DeeplinkHandler<"swap"> = (route, { navigate }) => {
  const { amountFrom, fromToken, toToken, affiliate } = route;

  const state: SwapState = {};

  if (fromToken && toToken && fromToken !== toToken) {
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
