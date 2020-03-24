// @flow

import type { Account, Operation } from "@ledgerhq/live-common/lib/types";

const helpURL = "https://support.ledger.com/hc/en-us/articles/360010653260";

function getURLWhatIsThis(op: Operation): ?string {
  if (op.type !== "IN" && op.type !== "OUT") {
    return helpURL;
  }
}

export default {
  getURLWhatIsThis,
};
