import type { AppManifest, DAppTrackingData } from "./types";

/**
 * This signature is to be compatible with track method of `segment.js` file in LLM and LLD
 * `track(event: string, properties: ?Object, mandatory: ?boolean)` in jsflow
 * {@link @ledger-desktop/renderer/analytics/segment#track}
 */
type TrackWalletAPI = (
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
export default function trackingWrapper(trackCall: TrackWalletAPI) {
  const track = (event: string, properties: Record<string, any> | null) =>
    trackCall(event, properties, null);

  return {
    // Failed to load the iframe
    load: (manifest: AppManifest) => {
      track("WalletAPI Load", getEventData(manifest));
    },

    // Failed to load the iframe
    reload: (manifest: AppManifest) => {
      track("WalletAPI Reload", getEventData(manifest));
    },

    // Failed to load the iframe
    loadFail: (manifest: AppManifest) => {
      // TODO: handle iframe failed
      track("WalletAPI Load Fail", getEventData(manifest));
    },

    // Successfully loaded the iframe
    loadSuccess: (manifest: AppManifest) => {
      track("WalletAPI Load Success", getEventData(manifest));
    },

    // Sign transaction modal open
    signTransactionRequested: (
      manifest: AppManifest,
      isEmbeddedSwap?: boolean,
      partner?: string,
    ) => {
      const properties = {
        ...getEventData(manifest),
        ...(isEmbeddedSwap !== undefined && { isEmbeddedSwap: String(isEmbeddedSwap) }),
        ...(partner !== undefined && { partner }),
      };
      track("WalletAPI SignTransaction", properties);
    },

    // Failed to sign transaction (cancel or error)
    signTransactionFail: (manifest: AppManifest, isEmbeddedSwap?: boolean, partner?: string) => {
      const properties = {
        ...getEventData(manifest),
        ...(isEmbeddedSwap !== undefined && { isEmbeddedSwap: String(isEmbeddedSwap) }),
        ...(partner !== undefined && { partner }),
      };
      track("WalletAPI SignTransaction Fail", properties);
    },

    // Successfully signed transaction
    signTransactionSuccess: (manifest: AppManifest, isEmbeddedSwap?: boolean, partner?: string) => {
      const properties = {
        ...getEventData(manifest),
        ...(isEmbeddedSwap !== undefined && { isEmbeddedSwap: String(isEmbeddedSwap) }),
        ...(partner !== undefined && { partner }),
      };
      track("WalletAPI SignTransaction Success", properties);
    },

    // Sign Raw transaction modal open
    signRawTransactionRequested: (manifest: AppManifest) => {
      track("WalletAPI SignRawTransaction", getEventData(manifest));
    },

    // Failed to sign raw transaction (cancel or error)
    signRawTransactionFail: (manifest: AppManifest) => {
      track("WalletAPI SignRawTransaction Fail", getEventData(manifest));
    },

    // Successfully signed raw transaction
    signRawTransactionSuccess: (manifest: AppManifest) => {
      track("WalletAPI SignRawTransaction Success", getEventData(manifest));
    },

    // Select account modal open
    requestAccountRequested: (manifest: AppManifest) => {
      track("WalletAPI RequestAccount", getEventData(manifest));
    },

    // Failed to select account (cancel or error)
    requestAccountFail: (manifest: AppManifest) => {
      track("WalletAPI RequestAccount Fail", getEventData(manifest));
    },

    // The user successfully selected an account
    requestAccountSuccess: (manifest: AppManifest) => {
      track("WalletAPI RequestAccount Success", getEventData(manifest));
    },

    // Select account modal open
    receiveRequested: (manifest: AppManifest) => {
      track("WalletAPI Receive", getEventData(manifest));
    },

    // Failed to select account (cancel or error)
    receiveFail: (manifest: AppManifest) => {
      track("WalletAPI Receive Fail", getEventData(manifest));
    },

    // The user successfully selected an account
    receiveSuccess: (manifest: AppManifest) => {
      track("WalletAPI Receive Success", getEventData(manifest));
    },

    // Failed to broadcast a signed transaction
    broadcastFail: (manifest: AppManifest, isEmbeddedSwap?: boolean, partner?: string) => {
      const properties = {
        ...getEventData(manifest),
        ...(isEmbeddedSwap !== undefined && { isEmbeddedSwap: String(isEmbeddedSwap) }),
        ...(partner !== undefined && { partner }),
      };
      track("WalletAPI Broadcast Fail", properties);
    },

    // Successfully broadcast a signed transaction
    broadcastSuccess: (manifest: AppManifest, isEmbeddedSwap?: boolean, partner?: string) => {
      const properties = {
        ...getEventData(manifest),
        ...(isEmbeddedSwap !== undefined && { isEmbeddedSwap: String(isEmbeddedSwap) }),
        ...(partner !== undefined && { partner }),
      };
      track("WalletAPI Broadcast Success", properties);
    },

    // Successfully broadcast a signed transaction
    broadcastOperationDetailsClick: (manifest: AppManifest) => {
      track("WalletAPI Broadcast OpD Clicked", getEventData(manifest));
    },

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

    signMessageRequested: (manifest: AppManifest) => {
      track("WalletAPI sign message requested", getEventData(manifest));
    },

    signMessageSuccess: (manifest: AppManifest) => {
      track("WalletAPI sign message success", getEventData(manifest));
    },

    signMessageFail: (manifest: AppManifest) => {
      track("WalletAPI sign message fail", getEventData(manifest));
    },

    signMessageUserRefused: (manifest: AppManifest) => {
      track("WalletAPI sign message user refused", getEventData(manifest));
    },
    deviceTransportRequested: (manifest: AppManifest) => {
      track("WalletAPI device transport requested", getEventData(manifest));
    },
    deviceTransportSuccess: (manifest: AppManifest) => {
      track("WalletAPI device transport success", getEventData(manifest));
    },
    deviceTransportFail: (manifest: AppManifest) => {
      track("WalletAPI device transport fail", getEventData(manifest));
    },
    deviceSelectRequested: (manifest: AppManifest) => {
      track("WalletAPI device select requested", getEventData(manifest));
    },
    deviceSelectSuccess: (manifest: AppManifest) => {
      track("WalletAPI device select success", getEventData(manifest));
    },
    deviceSelectFail: (manifest: AppManifest) => {
      track("WalletAPI device select fail", getEventData(manifest));
    },
    deviceOpenRequested: (manifest: AppManifest) => {
      track("WalletAPI device open requested", getEventData(manifest));
    },
    deviceExchangeRequested: (manifest: AppManifest) => {
      track("WalletAPI device exchange requested", getEventData(manifest));
    },
    deviceExchangeSuccess: (manifest: AppManifest) => {
      track("WalletAPI device exchange success", getEventData(manifest));
    },
    deviceExchangeFail: (manifest: AppManifest) => {
      track("WalletAPI device exchange fail", getEventData(manifest));
    },
    deviceCloseRequested: (manifest: AppManifest) => {
      track("WalletAPI device close requested", getEventData(manifest));
    },
    deviceCloseSuccess: (manifest: AppManifest) => {
      track("WalletAPI device close success", getEventData(manifest));
    },
    deviceCloseFail: (manifest: AppManifest) => {
      track("WalletAPI device close fail", getEventData(manifest));
    },
    bitcoinFamilyAccountAddressRequested: (manifest: AppManifest) => {
      track("WalletAPI bitcoin family account address requested", getEventData(manifest));
    },
    bitcoinFamilyAccountAddressFail: (manifest: AppManifest) => {
      track("WalletAPI bitcoin family account address fail", getEventData(manifest));
    },
    bitcoinFamilyAccountAddressSuccess: (manifest: AppManifest) => {
      track("WalletAPI bitcoin family account address success", getEventData(manifest));
    },
    bitcoinFamilyAccountPublicKeyRequested: (manifest: AppManifest) => {
      track("WalletAPI bitcoin family account publicKey requested", getEventData(manifest));
    },
    bitcoinFamilyAccountPublicKeyFail: (manifest: AppManifest) => {
      track("WalletAPI bitcoin family account publicKey fail", getEventData(manifest));
    },
    bitcoinFamilyAccountPublicKeySuccess: (manifest: AppManifest) => {
      track("WalletAPI bitcoin family account publicKey success", getEventData(manifest));
    },
    bitcoinFamilyAccountXpubRequested: (manifest: AppManifest) => {
      track("WalletAPI bitcoin family account xpub requested", getEventData(manifest));
    },
    bitcoinFamilyAccountXpubFail: (manifest: AppManifest) => {
      track("WalletAPI bitcoin family account xpub fail", getEventData(manifest));
    },
    bitcoinFamilyAccountXpubSuccess: (manifest: AppManifest) => {
      track("WalletAPI bitcoin family account xpub success", getEventData(manifest));
    },
    bitcoinFamilyAccountAddressesRequested: (manifest: AppManifest) => {
      track("WalletAPI bitcoin family account addresses requested", getEventData(manifest));
    },
    bitcoinFamilyAccountAddressesFail: (manifest: AppManifest) => {
      track("WalletAPI bitcoin family account addresses fail", getEventData(manifest));
    },
    bitcoinFamilyAccountAddressesSuccess: (manifest: AppManifest) => {
      track("WalletAPI bitcoin family account addresses success", getEventData(manifest));
    },

    // currency.list handler tracking
    currencyListRequested: (manifest: AppManifest) => {
      track("WalletAPI CurrencyList requested", getEventData(manifest));
    },
    currencyListSuccess: (manifest: AppManifest) => {
      track("WalletAPI CurrencyList success", getEventData(manifest));
    },
    currencyListFail: (manifest: AppManifest) => {
      track("WalletAPI CurrencyList fail", getEventData(manifest));
    },

    // account.list handler tracking
    accountListRequested: (manifest: AppManifest) => {
      track("WalletAPI AccountList requested", getEventData(manifest));
    },
    accountListSuccess: (manifest: AppManifest) => {
      track("WalletAPI AccountList success", getEventData(manifest));
    },
    accountListFail: (manifest: AppManifest) => {
      track("WalletAPI AccountList fail", getEventData(manifest));
    },

    dappSendTransactionRequested: (manifest: AppManifest, trackingData: DAppTrackingData) => {
      track("dApp SendTransaction requested", { ...getEventData(manifest), ...trackingData });
    },
    dappSendTransactionSuccess: (manifest: AppManifest, trackingData: DAppTrackingData) => {
      track("dApp SendTransaction success", { ...getEventData(manifest), ...trackingData });
    },
    dappSendTransactionFail: (manifest: AppManifest, trackingData?: DAppTrackingData) => {
      track("dApp SendTransaction fail", { ...getEventData(manifest), ...(trackingData || {}) });
    },
    dappPersonalSignRequested: (manifest: AppManifest) => {
      track("dApp PersonalSign requested", getEventData(manifest));
    },
    dappPersonalSignSuccess: (manifest: AppManifest) => {
      track("dApp PersonalSign success", getEventData(manifest));
    },
    dappPersonalSignFail: (manifest: AppManifest) => {
      track("dApp PersonalSign fail", getEventData(manifest));
    },
    dappSignTypedDataRequested: (manifest: AppManifest) => {
      track("dApp SignTypedData requested", getEventData(manifest));
    },
    dappSignTypedDataSuccess: (manifest: AppManifest) => {
      track("dApp SignTypedData success", getEventData(manifest));
    },
    dappSignTypedDataFail: (manifest: AppManifest) => {
      track("dApp SignTypedData fail", getEventData(manifest));
    },
  } as const;
}

export type TrackingAPI = ReturnType<typeof trackingWrapper>;
