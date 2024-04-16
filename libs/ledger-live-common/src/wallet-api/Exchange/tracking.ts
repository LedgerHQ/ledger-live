import type { AppManifest } from "../types";

/**
 * This signature is to be compatible with track method of `segment.js` file in LLM and LLD
 * `track(event: string, properties: ?Object, mandatory: ?boolean)` in jsflow
 * {@link @ledger-desktop/renderer/analytics/segment#track}
 */
type TrackExchange = (
  event: string,
  properties: Record<string, any> | null,
  mandatory: boolean | null,
) => void;

/**
 * Obtain Event data from WalletAPI App manifest
 *
 * @param {AppManifest} manifest
 * @returns Object - event data
 */
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
  const track = (event: string, properties: Record<string, any> | null) =>
    trackCall(event, properties, null);

  return {
    // Generate Exchange nonce modal open
    startExchangeRequested: (manifest: AppManifest) => {
      track("WalletAPI start Exchange Nonce request", getEventData(manifest));
    },

    // Successfully generated an Exchange app nonce
    startExchangeSuccess: (manifest: AppManifest) => {
      track("WalletAPI start Exchange Nonce success", getEventData(manifest));
    },

    // Failed to generate an Exchange app nonce
    startExchangeFail: (manifest: AppManifest) => {
      track("WalletAPI start Exchange Nonce fail", getEventData(manifest));
    },

    // No Params to generate an Exchange app nonce
    startExchangeNoParams: (manifest: AppManifest) => {
      track("WalletAPI start Exchange no params", getEventData(manifest));
    },

    completeExchangeRequested: (manifest: AppManifest) => {
      track("WalletAPI complete Exchange requested", getEventData(manifest));
    },

    // Successfully completed an Exchange
    completeExchangeSuccess: (manifest: AppManifest) => {
      track("WalletAPI complete Exchange success", getEventData(manifest));
    },

    // Failed to complete an Exchange
    completeExchangeFail: (manifest: AppManifest) => {
      track("WalletAPI complete Exchange Nonce fail", getEventData(manifest));
    },

    // No Params to complete an Exchange
    completeExchangeNoParams: (manifest: AppManifest) => {
      track("WalletAPI complete Exchange no params", getEventData(manifest));
    },
  } as const;
}

export type TrackingAPI = ReturnType<typeof trackingWrapper>;
