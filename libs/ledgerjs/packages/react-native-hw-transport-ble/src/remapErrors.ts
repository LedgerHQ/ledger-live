import {
  DisconnectedDevice,
  PairingFailed,
  PeerRemovedPairing,
} from "@ledgerhq/errors";

export const remapError = (error: any) => {
  if (!error || !error.message) return error;

  if (
    error.iosErrorCode === 14 ||
    error.reason === "Peer removed pairing information"
  ) {
    return new PeerRemovedPairing();
  } else if (error?.attErrorCode === 22) {
    // It's not documented but seems to match a refusal on Android pairing
    return new PairingFailed();
  } else if (
    error.message.includes("was disconnected") ||
    error.message.includes("not found")
  ) {
    return new DisconnectedDevice();
  }

  return error;
};
export const rethrowError = (e: Error | null | undefined) => {
  throw remapError(e);
};
export const decoratePromiseErrors = <A>(promise: Promise<A>): Promise<A> =>
  promise.catch(rethrowError);
