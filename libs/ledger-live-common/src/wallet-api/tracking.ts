import type { LiveAppManifest } from "../platform/types";

/**
 * This signature is to be compatible with track method of `segment.js` file in LLM and LLD
 * `track(event: string, properties: ?Object, mandatory: ?boolean)` in jsflow
 * {@link @ledger-desktop/renderer/analytics/segment#track}
 */
type TrackWalletAPI = (
  event: string,
  properties: Record<string, any> | null,
  mandatory: boolean | null
) => void;

/**
 * Obtain Event data from WalletAPI App manifest
 *
 * @param {LiveAppManifest} manifest
 * @returns Object - event data
 */
function getEventData(manifest: LiveAppManifest) {
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
export default function trackingWrapper(trackCall: TrackWalletAPI) {
  const track = (event: string, properties: Record<string, any> | null) =>
    trackCall(event, properties, null);

  return {
    // Failed to load the iframe
    load: (manifest: LiveAppManifest) => {
      track("WalletAPI Load", getEventData(manifest));
    },

    // Failed to load the iframe
    reload: (manifest: LiveAppManifest) => {
      track("WalletAPI Reload", getEventData(manifest));
    },

    // Failed to load the iframe
    loadFail: (manifest: LiveAppManifest) => {
      // TODO: handle iframe failed
      track("WalletAPI Load Fail", getEventData(manifest));
    },

    // Successfully loaded the iframe
    loadSuccess: (manifest: LiveAppManifest) => {
      track("WalletAPI Load Success", getEventData(manifest));
    },

    // Sign transaction modal open
    signTransactionRequested: (manifest: LiveAppManifest) => {
      track("WalletAPI SignTransaction", getEventData(manifest));
    },

    // Failed to sign transaction (cancel or error)
    signTransactionFail: (manifest: LiveAppManifest) => {
      track("WalletAPI SignTransaction Fail", getEventData(manifest));
    },

    // Successfully signed transaction
    signTransactionSuccess: (manifest: LiveAppManifest) => {
      track("WalletAPI SignTransaction Success", getEventData(manifest));
    },

    // Select account modal open
    requestAccountRequested: (manifest: LiveAppManifest) => {
      track("WalletAPI RequestAccount", getEventData(manifest));
    },

    // Failed to select account (cancel or error)
    requestAccountFail: (manifest: LiveAppManifest) => {
      track("WalletAPI RequestAccount Fail", getEventData(manifest));
    },

    // The user successfully selected an account
    requestAccountSuccess: (manifest: LiveAppManifest) => {
      track("WalletAPI RequestAccount Success", getEventData(manifest));
    },

    // Select account modal open
    receiveRequested: (manifest: LiveAppManifest) => {
      track("WalletAPI Receive", getEventData(manifest));
    },

    // Failed to select account (cancel or error)
    receiveFail: (manifest: LiveAppManifest) => {
      track("WalletAPI Receive Fail", getEventData(manifest));
    },

    // The user successfully selected an account
    receiveSuccess: (manifest: LiveAppManifest) => {
      track("WalletAPI Receive Success", getEventData(manifest));
    },

    // Failed to broadcast a signed transaction
    broadcastFail: (manifest: LiveAppManifest) => {
      track("WalletAPI Broadcast Fail", getEventData(manifest));
    },

    // Successfully broadcast a signed transaction
    broadcastSuccess: (manifest: LiveAppManifest) => {
      track("WalletAPI Broadcast Success", getEventData(manifest));
    },

    // Successfully broadcast a signed transaction
    broadcastOperationDetailsClick: (manifest: LiveAppManifest) => {
      track("WalletAPI Broadcast OpD Clicked", getEventData(manifest));
    },

    // Generate Exchange nonce modal open
    startExchangeRequested: (manifest: LiveAppManifest) => {
      track("WalletAPI start Exchange Nonce request", getEventData(manifest));
    },

    // Successfully generated an Exchange app nonce
    startExchangeSuccess: (manifest: LiveAppManifest) => {
      track("WalletAPI start Exchange Nonce success", getEventData(manifest));
    },

    // Failed to generate an Exchange app nonce
    startExchangeFail: (manifest: LiveAppManifest) => {
      track("WalletAPI start Exchange Nonce fail", getEventData(manifest));
    },

    completeExchangeRequested: (manifest: LiveAppManifest) => {
      track("WalletAPI complete Exchange requested", getEventData(manifest));
    },

    // Successfully completed an Exchange
    completeExchangeSuccess: (manifest: LiveAppManifest) => {
      track("WalletAPI complete Exchange success", getEventData(manifest));
    },

    // Failed to complete an Exchange
    completeExchangeFail: (manifest: LiveAppManifest) => {
      track("WalletAPI complete Exchange Nonce fail", getEventData(manifest));
    },

    signMessageRequested: (manifest: LiveAppManifest) => {
      track("WalletAPI sign message requested", getEventData(manifest));
    },

    signMessageSuccess: (manifest: LiveAppManifest) => {
      track("WalletAPI sign message success", getEventData(manifest));
    },

    signMessageFail: (manifest: LiveAppManifest) => {
      track("WalletAPI sign message fail", getEventData(manifest));
    },

    signMessageUserRefused: (manifest: LiveAppManifest) => {
      track("WalletAPI sign message user refused", getEventData(manifest));
    },
    deviceTransportRequested: (manifest: LiveAppManifest) => {
      track("WalletAPI device transport requested", getEventData(manifest));
    },
    deviceTransportSuccess: (manifest: LiveAppManifest) => {
      track("WalletAPI device transport success", getEventData(manifest));
    },
    deviceTransportFail: (manifest: LiveAppManifest) => {
      track("WalletAPI device transport fail", getEventData(manifest));
    },
    deviceExchangeRequested: (manifest: LiveAppManifest) => {
      track("WalletAPI device exchange requested", getEventData(manifest));
    },
    deviceExchangeSuccess: (manifest: LiveAppManifest) => {
      track("WalletAPI device exchange success", getEventData(manifest));
    },
    deviceExchangeFail: (manifest: LiveAppManifest) => {
      track("WalletAPI device exchange fail", getEventData(manifest));
    },
    deviceCloseRequested: (manifest: LiveAppManifest) => {
      track("WalletAPI device close requested", getEventData(manifest));
    },
    deviceCloseSuccess: (manifest: LiveAppManifest) => {
      track("WalletAPI device close success", getEventData(manifest));
    },
    deviceCloseFail: (manifest: LiveAppManifest) => {
      track("WalletAPI device close fail", getEventData(manifest));
    },
    bitcoinFamillyAccountXpubRequested: (manifest: LiveAppManifest) => {
      track(
        "WalletAPI bitcoin familly account xpub requested",
        getEventData(manifest)
      );
    },
    bitcoinFamillyAccountXpubFail: (manifest: LiveAppManifest) => {
      track(
        "WalletAPI bitcoin familly account xpub fail",
        getEventData(manifest)
      );
    },
    bitcoinFamillyAccountXpubSuccess: (manifest: LiveAppManifest) => {
      track(
        "WalletAPI bitcoin familly account xpub success",
        getEventData(manifest)
      );
    },
  } as const;
}

export type TrackingAPI = ReturnType<typeof trackingWrapper>;
