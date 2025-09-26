import { useCallback } from "react";
import { track } from "~/renderer/analytics/segment";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

type UseMarketOnStakeProps = {
  internalCurrency?: CryptoOrTokenCurrency;
  page?: string;
  stakeDefaultTrack: Record<string, unknown>;
  startStakeFlow: (args: { currencies?: string[]; source?: string; returnTo?: string }) => void;
  currentPathname: string;
  currencyTicker?: string;
};

export function useMarketOnStake({
  internalCurrency,
  page,
  stakeDefaultTrack,
  startStakeFlow,
  currentPathname,
  currencyTicker,
}: UseMarketOnStakeProps) {
  return useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      track("button_clicked2", {
        button: "stake",
        currency: internalCurrency ? internalCurrency.ticker : currencyTicker,
        page,
        ...stakeDefaultTrack,
      });
      setTrackingSource(page);
      startStakeFlow({
        currencies: internalCurrency ? [internalCurrency.id] : undefined,
        source: page,
        returnTo: currentPathname,
      });
    },
    [internalCurrency, currencyTicker, page, stakeDefaultTrack, startStakeFlow, currentPathname],
  );
}
