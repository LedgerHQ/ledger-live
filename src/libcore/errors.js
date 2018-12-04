// @flow
import {
  NotEnoughBalance,
  NetworkDown,
} from "@ledgerhq/live-common/lib/errors";

export function remapLibcoreErrors(error: Error, fallbackError?: Error): Error {
  if (!error || !error.name) return fallbackError || error;
  // in the current effort of remapping libcore errors, we're console.logging it
  if (__DEV__) console.log("remapLibcoreErrors", { error }); // eslint-disable-line no-console
  const msg = error.message;

  if (msg.includes("Cannot gather enough funds")) {
    return new NotEnoughBalance();
  }

  if (msg.includes("The Internet connection appears to be offline")) {
    return new NetworkDown();
  }

  return fallbackError || error;
}
