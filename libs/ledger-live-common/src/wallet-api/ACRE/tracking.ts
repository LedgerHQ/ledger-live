import type { AppManifest } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Properties = Record<string, any> | null;

/**
 * This signature is to be compatible with track method of `segment.js` file in LLM and LLD
 * `track(event: string, properties: ?Object, mandatory: ?boolean)` in jsflow
 * {@link @ledger-desktop/renderer/analytics/segment#track}
 */
type TrackExchange = (event: string, properties: Properties, mandatory: boolean | null) => void;

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
  const track = (event: string, properties: Properties) => trackCall(event, properties, null);

  return {
    // Sign message no params
    signMessageNoParams: (manifest: AppManifest) => {
      track("WalletAPI ACRE SignMessage no params", getEventData(manifest));
    },

    signMessageRequested: (manifest: AppManifest) => {
      track("WalletAPI ACRE sign message requested", getEventData(manifest));
    },

    signMessageSuccess: (manifest: AppManifest) => {
      track("WalletAPI ACRE sign message success", getEventData(manifest));
    },

    signMessageFail: (manifest: AppManifest) => {
      track("WalletAPI ACRE sign message fail", getEventData(manifest));
    },

    signMessageUserRefused: (manifest: AppManifest) => {
      track("WalletAPI ACRE sign message user refused", getEventData(manifest));
    },

    // Sign transaction no params
    signTransactionNoParams: (manifest: AppManifest) => {
      track("WalletAPI ACRE SignTransaction no params", getEventData(manifest));
    },

    // Sign transaction modal open
    signTransactionRequested: (manifest: AppManifest) => {
      track("WalletAPI ACRE SignTransaction", getEventData(manifest));
    },

    // Failed to sign transaction (cancel or error)
    signTransactionFail: (manifest: AppManifest) => {
      track("WalletAPI ACRE SignTransaction Fail", getEventData(manifest));
    },

    // Successfully signed transaction
    signTransactionSuccess: (manifest: AppManifest) => {
      track("WalletAPI ACRE SignTransaction Success", getEventData(manifest));
    },

    // Sign transaction and broadcast no params
    signTransactionAndBroadcastNoParams: (manifest: AppManifest) => {
      track("WalletAPI ACRE SignTransactionAndBroadcast no params", getEventData(manifest));
    },

    // Failed to broadcast a signed transaction
    broadcastFail: (manifest: AppManifest) => {
      track("WalletAPI ACRE Broadcast Fail", getEventData(manifest));
    },

    // Successfully broadcast a signed transaction
    broadcastSuccess: (manifest: AppManifest) => {
      track("WalletAPI ACRE Broadcast Success", getEventData(manifest));
    },

    // Successfully broadcast a signed transaction
    broadcastOperationDetailsClick: (manifest: AppManifest) => {
      track("WalletAPI ACRE Broadcast OpD Clicked", getEventData(manifest));
    },
  } as const;
}

export type TrackingAPI = ReturnType<typeof trackingWrapper>;
