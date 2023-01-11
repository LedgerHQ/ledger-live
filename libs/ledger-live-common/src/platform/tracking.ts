import type { LiveAppManifest } from "./types";

/**
 * This signature is to be compatible with track method of `segment.js` file in LLM and LLD
 * `track(event: string, properties: ?Object, mandatory: ?boolean)` in jsflow
 * {@link @ledger-desktop/renderer/analytics/segment#track}
 */
type TrackPlatform = (
  event: string,
  properties: Record<string, any> | null,
  mandatory: boolean | null
) => void;

export type TrackFunction = (manifest: LiveAppManifest) => void;

/**
 * Obtain Event data from Platform App manifest
 *
 * @param {LiveAppManifest} manifest
 * @returns Object - event data
 */
function getEventData(manifest: LiveAppManifest) {
  return { platform: manifest.name };
}

/**
 * Wrap call to underlying trackCall function.
 * @param trackCall
 * @returns a dictionary of event to trigger.
 */
export default function trackingWrapper(
  trackCall: TrackPlatform
): Record<string, TrackFunction> {
  const track = (event: string, properties: Record<string, any> | null) =>
    trackCall(event, properties, null);

  return {
    // Failed to load the iframe
    platformLoad: (manifest: LiveAppManifest) => {
      track("Platform Load", getEventData(manifest));
    },

    // Failed to load the iframe
    platformReload: (manifest: LiveAppManifest) => {
      track("Platform Reload", getEventData(manifest));
    },

    // Failed to load the iframe
    platformLoadFail: (manifest: LiveAppManifest) => {
      // TODO: handle iframe failed
      track("Platform Load Fail", getEventData(manifest));
    },

    // Successfully loaded the iframe
    platformLoadSuccess: (manifest: LiveAppManifest) => {
      track("Platform Load Success", getEventData(manifest));
    },

    // Sign transaction modal open
    platformSignTransactionRequested: (manifest: LiveAppManifest) => {
      track("Platform SignTransaction", getEventData(manifest));
    },

    // Failed to sign transaction (cancel or error)
    platformSignTransactionFail: (manifest: LiveAppManifest) => {
      track("Platform SignTransaction Fail", getEventData(manifest));
    },

    // Successfully signed transaction
    platformSignTransactionSuccess: (manifest: LiveAppManifest) => {
      track("Platform SignTransaction Success", getEventData(manifest));
    },

    // Select account modal open
    platformRequestAccountRequested: (manifest: LiveAppManifest) => {
      track("Platform RequestAccount", getEventData(manifest));
    },

    // Failed to select account (cancel or error)
    platformRequestAccountFail: (manifest: LiveAppManifest) => {
      track("Platform RequestAccount Fail", getEventData(manifest));
    },

    // The user successfully selected an account
    platformRequestAccountSuccess: (manifest: LiveAppManifest) => {
      track("Platform RequestAccount Success", getEventData(manifest));
    },

    // Select account modal open
    platformReceiveRequested: (manifest: LiveAppManifest) => {
      track("Platform Receive", getEventData(manifest));
    },

    // Failed to select account (cancel or error)
    platformReceiveFail: (manifest: LiveAppManifest) => {
      track("Platform Receive Fail", getEventData(manifest));
    },

    // The user successfully selected an account
    platformReceiveSuccess: (manifest: LiveAppManifest) => {
      track("Platform Receive Success", getEventData(manifest));
    },

    // Failed to broadcast a signed transaction
    platformBroadcastFail: (manifest: LiveAppManifest) => {
      track("Platform Broadcast Fail", getEventData(manifest));
    },

    // Successfully broadcast a signed transaction
    platformBroadcastSuccess: (manifest: LiveAppManifest) => {
      track("Platform Broadcast Success", getEventData(manifest));
    },

    // Successfully broadcast a signed transaction
    platformBroadcastOperationDetailsClick: (manifest: LiveAppManifest) => {
      track("Platform Broadcast OpD Clicked", getEventData(manifest));
    },

    // Generate Exchange nonce modal open
    platformStartExchangeRequested: (manifest: LiveAppManifest) => {
      track("Platform start Exchange Nonce request", getEventData(manifest));
    },

    // Successfully generated an Exchange app nonce
    platformStartExchangeSuccess: (manifest: LiveAppManifest) => {
      track("Platform start Exchange Nonce success", getEventData(manifest));
    },

    // Failed to generate an Exchange app nonce
    platformStartExchangeFail: (manifest: LiveAppManifest) => {
      track("Platform start Exchange Nonce fail", getEventData(manifest));
    },

    platformCompleteExchangeRequested: (manifest: LiveAppManifest) => {
      track("Platform complete Exchange requested", getEventData(manifest));
    },

    // Successfully completed an Exchange
    platformCompleteExchangeSuccess: (manifest: LiveAppManifest) => {
      track("Platform complete Exchange success", getEventData(manifest));
    },

    // Failed to complete an Exchange
    platformCompleteExchangeFail: (manifest: LiveAppManifest) => {
      track("Platform complete Exchange Nonce fail", getEventData(manifest));
    },

    platformSignMessageRequested: (manifest: LiveAppManifest) => {
      track("Platform sign message requested", getEventData(manifest));
    },

    platformSignMessageSuccess: (manifest: LiveAppManifest) => {
      track("Platform sign message success", getEventData(manifest));
    },

    platformSignMessageFail: (manifest: LiveAppManifest) => {
      track("Platform sign message fail", getEventData(manifest));
    },

    platformSignMessageUserRefused: (manifest: LiveAppManifest) => {
      track("Platform sign message user refused", getEventData(manifest));
    },
  };
}
