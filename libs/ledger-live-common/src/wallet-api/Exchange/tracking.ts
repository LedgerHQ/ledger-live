import type { AppManifest } from "../types";

/**
 * This signature is to be compatible with track method of `segment.js` file in LLM and LLD
 * `track(event: string, properties: ?Object, mandatory: ?boolean)` in jsflow
 * {@link @ledger-desktop/renderer/analytics/segment#track}
 */
type TrackExchange = (
  event: string,
  properties: Record<string, string> | null,
  mandatory: boolean | null,
) => void;

interface TrackEventPayload {
  exchangeType: "SELL" | "FUND" | "SWAP";
  provider: string;
}

function getEventData(manifest: AppManifest) {
  return { walletAPI: manifest.name };
}

/**
 * Wrap call to underlying trackCall function.
 * @param trackCall
 * @returns a dictionary of event to trigger.
 */
// Disabling explicit module boundary types as we're using const
// in order to get the exact type matching the tracking wrapper API
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function trackingWrapper(trackCall: TrackExchange) {
  const track = (event: string, properties: Record<string, string> | null) => {
    return trackCall(event, properties, null);
  };

  return {
    // Generate Exchange nonce modal open
    startExchangeRequested: ({ provider, exchangeType }: TrackEventPayload) => {
      track(`Starts Exchange ${exchangeType} Nonce request`, { provider, exchangeType });
    },

    // Successfully generated an Exchange app nonce
    startExchangeSuccess: ({ provider, exchangeType }: TrackEventPayload) => {
      track(`Starts Exchange ${exchangeType} Nonce success`, { provider, exchangeType });
    },

    // Failed to generate an Exchange app nonce
    startExchangeFail: ({ provider, exchangeType }: TrackEventPayload) => {
      track(`Starts Exchange ${exchangeType} Nonce fail`, { provider, exchangeType });
    },

    // No Params to generate an Exchange app nonce
    startExchangeNoParams: (manifest: AppManifest) => {
      track("Starts Exchange no params", getEventData(manifest));
    },

    completeExchangeRequested: ({ provider, exchangeType }: TrackEventPayload) => {
      track(`Completes Exchange ${exchangeType} requested`, { provider, exchangeType });
    },

    // Successfully completed an Exchange
    completeExchangeSuccess: ({
      provider,
      exchangeType,
      currency,
    }: TrackEventPayload & { currency: string }) => {
      track(`Completes Exchange ${exchangeType} success`, { provider, exchangeType, currency });
    },

    // Failed to complete an Exchange
    completeExchangeFail: ({ provider, exchangeType }: TrackEventPayload) => {
      track(`Completes Exchange ${exchangeType} Nonce fail`, { provider, exchangeType });
    },

    // No Params to complete an Exchange
    completeExchangeNoParams: (manifest: AppManifest) => {
      track("Completes Exchange no params", getEventData(manifest));
    },
  } as const;
}

export type TrackingAPI = ReturnType<typeof trackingWrapper>;
