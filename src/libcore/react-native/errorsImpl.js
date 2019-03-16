// @flow
import {
  NotEnoughBalance,
  NetworkDown,
} from "@ledgerhq/live-common/lib/errors";

export function remapLibcoreErrors(error: Error): Error {
  if (!error || !error.message) return error;
  // in the current effort of remapping libcore errors, we're console.logging it
  if (__DEV__) console.log("remapLibcoreErrors", { error }); // eslint-disable-line no-console
  const msg = error.message;

  if (msg.includes("Cannot gather enough funds")) {
    return new NotEnoughBalance();
  }

  // TODO the part below this line is RN specifics, we'll need to move out

  if (
    msg.includes("The Internet connection appears to be offline") ||
    msg.includes(
      '"explorers.api.live.ledger.com": No address associated with hostname',
    )
  ) {
    return new NetworkDown();
  }

  // Attempt to recover the human readable error from a verbose iOS trace
  const pattern = /NS[\w]+Error.+Code.+"([\w .]+)"/;
  const match = pattern.exec(msg);
  if (match && match[1] !== "(null)") {
    return new Error(match[1]);
  }

  return error;
}
