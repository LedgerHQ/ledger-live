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
  isEmbeddedSwap?: boolean;
}

/**
 * Converts isEmbeddedSwap boolean to string for analytics consistency
 */
const formatIsEmbeddedSwap = (isEmbeddedSwap?: boolean): string | undefined =>
  isEmbeddedSwap !== undefined ? String(isEmbeddedSwap) : undefined;

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
  const track = (event: string, properties: Record<string, string | undefined> | null) => {
    // Filter out undefined values before passing to trackCall
    if (!properties) {
      return trackCall(event, null, null);
    }
    const filteredProperties: Record<string, string> = {};
    for (const [key, value] of Object.entries(properties)) {
      if (value !== undefined) {
        filteredProperties[key] = value;
      }
    }
    return trackCall(event, filteredProperties, null);
  };

  return {
    // Generate Exchange nonce modal open
    startExchangeRequested: ({ provider, exchangeType, isEmbeddedSwap }: TrackEventPayload) => {
      track(`Starts Exchange ${exchangeType} Nonce request`, {
        provider,
        exchangeType,
        isEmbeddedSwap: formatIsEmbeddedSwap(isEmbeddedSwap),
      });
    },

    // Successfully generated an Exchange app nonce
    startExchangeSuccess: ({ provider, exchangeType, isEmbeddedSwap }: TrackEventPayload) => {
      track(`Starts Exchange ${exchangeType} Nonce success`, {
        provider,
        exchangeType,
        isEmbeddedSwap: formatIsEmbeddedSwap(isEmbeddedSwap),
      });
    },

    // Failed to generate an Exchange app nonce
    startExchangeFail: ({ provider, exchangeType, isEmbeddedSwap }: TrackEventPayload) => {
      track(`Starts Exchange ${exchangeType} Nonce fail`, {
        provider,
        exchangeType,
        isEmbeddedSwap: formatIsEmbeddedSwap(isEmbeddedSwap),
      });
    },

    // No Params to generate an Exchange app nonce
    startExchangeNoParams: (manifest: AppManifest) => {
      track("Starts Exchange no params", getEventData(manifest));
    },

    completeExchangeRequested: ({ provider, exchangeType, isEmbeddedSwap }: TrackEventPayload) => {
      track(`Completes Exchange ${exchangeType} requested`, {
        provider,
        exchangeType,
        isEmbeddedSwap: formatIsEmbeddedSwap(isEmbeddedSwap),
      });
    },

    // Successfully completed an Exchange
    completeExchangeSuccess: ({
      provider,
      exchangeType,
      currency,
      isEmbeddedSwap,
    }: TrackEventPayload & { currency: string }) => {
      track(`Completes Exchange ${exchangeType} success`, {
        provider,
        exchangeType,
        currency,
        isEmbeddedSwap: formatIsEmbeddedSwap(isEmbeddedSwap),
      });
    },

    // Failed to complete an Exchange
    completeExchangeFail: ({ provider, exchangeType, isEmbeddedSwap }: TrackEventPayload) => {
      track(`Completes Exchange ${exchangeType} Nonce fail`, {
        provider,
        exchangeType,
        isEmbeddedSwap: formatIsEmbeddedSwap(isEmbeddedSwap),
      });
    },

    // No Params to complete an Exchange
    completeExchangeNoParams: (manifest: AppManifest) => {
      track("Completes Exchange no params", getEventData(manifest));
    },

    swapPayloadRequested: ({
      provider,
      transactionId,
      fromAccountAddress,
      toAccountAddress,
      fromCurrencyId,
      toCurrencyId,
      fromAmount,
      quoteId,
    }: {
      provider: string;
      transactionId: string;
      fromAccountAddress: string;
      toAccountAddress: string;
      fromCurrencyId: string;
      toCurrencyId?: string;
      fromAmount: string | number;
      quoteId?: string;
    }) => {
      track("Swap payload requested", {
        provider,
        transactionId,
        fromAccountAddress,
        toAccountAddress,
        fromCurrencyId,
        toCurrencyId,
        fromAmount: String(fromAmount),
        quoteId,
      });
    },

    swapResponseRetrieved: ({
      binaryPayload,
      signature,
      payinAddress,
      swapId,
      payinExtraId,
      extraTransactionParameters,
    }: {
      binaryPayload: string;
      signature: string;
      payinAddress: string;
      swapId: string;
      payinExtraId?: string;
      extraTransactionParameters?: string;
    }) => {
      track("Swap response retrieved", {
        binaryPayload,
        signature,
        payinAddress,
        swapId,
        payinExtraId,
        extraTransactionParameters,
      });
    },
  } as const;
}

export type TrackingAPI = ReturnType<typeof trackingWrapper>;
