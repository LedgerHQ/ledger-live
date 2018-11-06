// @flow
import { NotEnoughBalance } from "@ledgerhq/live-common/lib/errors";

const NOT_ENOUGH_FUNDS = /* 52; */ "NOT_ENOUGH_FUNDS";

export function remapLibcoreErrors(error: Error): Error {
  if (!error || !error.name) return error;
  // in the current effort of remapping libcore errors, we're console.logging it
  console.log("remapLibcoreErrors", { error }); // eslint-disable-line no-console
  if (
    // $FlowFixMe
    error.code.indexOf(NOT_ENOUGH_FUNDS) > -1 ||
    error.message.indexOf("Cannot gather enough funds") > -1
  ) {
    return new NotEnoughBalance();
  }

  return error;
}
