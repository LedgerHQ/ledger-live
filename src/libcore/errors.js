// @flow
import { NotEnoughBalance } from "@ledgerhq/live-common/lib/errors";

const NOT_ENOUGH_FUNDS = /* 52; */ "NOT_ENOUGH_FUNDS";

export default function remapLibcoreErrors(error: Error): Error {
  if (
    // $FlowFixMe
    error.code.indexOf(NOT_ENOUGH_FUNDS) > -1 ||
    error.message.indexOf("Cannot gather enough funds") > -1
  ) {
    throw new NotEnoughBalance();
  }

  throw error;
}
