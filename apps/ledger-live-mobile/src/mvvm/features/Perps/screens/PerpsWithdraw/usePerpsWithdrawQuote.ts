import { useEffect, useState } from "react";
import BigNumber from "bignumber.js";
import { fetchWithdrawQuote } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/api";
import type { WithdrawQuote } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/schemas";

const QUOTE_DEBOUNCE_MS = 500;

export type PerpsWithdrawQuoteParams = {
  /** USDC amount, as typed. */
  amount: string;
  sourceAddress: string;
  toCurrencyId: string | undefined;
  destinationAddress: string | undefined;
};

export type PerpsWithdrawQuoteState = {
  quote: WithdrawQuote | undefined;
  isLoading: boolean;
  error: Error | null;
};

const IDLE: PerpsWithdrawQuoteState = { quote: undefined, isLoading: false, error: null };
const LOADING: PerpsWithdrawQuoteState = { quote: undefined, isLoading: true, error: null };

function requestKeyOf({
  amount,
  sourceAddress,
  toCurrencyId,
  destinationAddress,
}: PerpsWithdrawQuoteParams) {
  if (!toCurrencyId || !destinationAddress) return null;
  if (!new BigNumber(amount).isGreaterThan(0)) return null;
  return [amount, sourceAddress, toCurrencyId, destinationAddress].join("|");
}

/** Debounced SwapKit quote, refreshed whenever the amount or destination changes. */
export function usePerpsWithdrawQuote(params: PerpsWithdrawQuoteParams): PerpsWithdrawQuoteState {
  const { amount, sourceAddress, toCurrencyId, destinationAddress } = params;
  const requestKey = requestKeyOf(params);
  const [current, setCurrent] = useState<{ key: string | null; state: PerpsWithdrawQuoteState }>({
    key: null,
    state: IDLE,
  });

  useEffect(() => {
    if (requestKey === null || !toCurrencyId || !destinationAddress) {
      setCurrent({ key: null, state: IDLE });
      return;
    }

    setCurrent({ key: requestKey, state: LOADING });

    let stale = false;
    const timeout = setTimeout(() => {
      fetchWithdrawQuote({
        amount: new BigNumber(amount),
        sourceAddress,
        toCurrencyId,
        destinationAddress,
      })
        .then(quote => {
          if (!stale)
            setCurrent({ key: requestKey, state: { quote, isLoading: false, error: null } });
        })
        .catch((error: unknown) => {
          if (stale) return;
          setCurrent({
            key: requestKey,
            state: {
              quote: undefined,
              isLoading: false,
              error: error instanceof Error ? error : new Error(String(error)),
            },
          });
        });
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      stale = true;
      clearTimeout(timeout);
    };
    // The key covers every input.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  // Effects run a render late, so a stale result is dropped here instead.
  if (current.key !== requestKey) return requestKey === null ? IDLE : LOADING;
  return current.state;
}
