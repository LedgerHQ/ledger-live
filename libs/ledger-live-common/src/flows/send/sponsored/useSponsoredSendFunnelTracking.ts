import { useEffect, useMemo, useRef } from "react";
import { getSponsoredSendEvent, getSponsoredSendTrackingProperties } from "./tracking";
import type { SponsoredFeeQuote } from "../../../bridge/generic-coin-framework/sponsored";
import type { SponsoredSendEvent, SponsoredSendTrackingInput } from "./types";

type UseSponsoredSendFunnelTrackingParams = Omit<SponsoredSendTrackingInput, "quotedFee"> &
  Readonly<{
    quote: SponsoredFeeQuote | null;
    flowSessionId: string;
    /** The app's send-flow properties, merged into every event. */
    properties: Readonly<Record<string, unknown>>;
    track: (event: SponsoredSendEvent, properties: Readonly<Record<string, unknown>>) => unknown;
  }>;

/** Tracks each funnel step once, from the orchestration's state rather than from a screen. */
export function useSponsoredSendFunnelTracking({
  state,
  provider,
  quote,
  standardFeeFiat,
  sponsoredFeeFiat,
  fiatCurrency,
  flowSessionId,
  properties,
  track,
}: UseSponsoredSendFunnelTrackingParams): void {
  const quotedFee = useMemo(
    () => (quote ? { asset: quote.feeAsset, amount: quote.value } : null),
    [quote],
  );

  // Only a state change can emit: other inputs re-run the effect with prev === state.
  const prevStateRef = useRef(state);
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    const event = getSponsoredSendEvent(prev, state);
    if (!event) return;
    track(event, {
      ...properties,
      flow_session_id: flowSessionId,
      ...getSponsoredSendTrackingProperties(event, {
        state,
        provider,
        quotedFee,
        standardFeeFiat,
        sponsoredFeeFiat,
        fiatCurrency,
      }),
    });
  }, [
    state,
    provider,
    quotedFee,
    standardFeeFiat,
    sponsoredFeeFiat,
    fiatCurrency,
    flowSessionId,
    properties,
    track,
  ]);
}
