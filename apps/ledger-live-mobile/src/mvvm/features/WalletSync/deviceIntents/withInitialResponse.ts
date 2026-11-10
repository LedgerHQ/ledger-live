import type {
  GetOrCreateTrustchainCallbacks,
  TrustchainSDK,
} from "@ledgerhq/ledger-key-ring-protocol/types";

type OnInitialResponse = NonNullable<GetOrCreateTrustchainCallbacks["onInitialResponse"]>;

/**
 * The SDK, with `onInitialResponse` added to every `getOrCreateTrustchain` call: the add member
 * intent only passes the device callbacks. A throw from it rejects the call.
 */
export function withInitialResponse(
  sdk: TrustchainSDK,
  onInitialResponse: OnInitialResponse,
): TrustchainSDK {
  const getOrCreateTrustchain: TrustchainSDK["getOrCreateTrustchain"] = (
    deviceId,
    memberCredentials,
    callbacks,
    topic,
    currentTrustchain,
  ) =>
    sdk.getOrCreateTrustchain(
      deviceId,
      memberCredentials,
      { ...callbacks, onInitialResponse },
      topic,
      currentTrustchain,
    );

  return new Proxy(sdk, {
    get: (target, property) =>
      property === "getOrCreateTrustchain" ? getOrCreateTrustchain : Reflect.get(target, property),
  });
}
