// @flow
import { NotEnoughBalance } from "@ledgerhq/live-common/lib/errors";

export function remapLibcoreErrors(error: Error): Error {
  if (!error || !error.name) return error;
  // in the current effort of remapping libcore errors, we're console.logging it
  console.log("remapLibcoreErrors", { error }); // eslint-disable-line no-console

  const msg = error.message;

  if (msg.includes("Cannot gather enough funds")) {
    return new NotEnoughBalance();
  }

  return error;
}
