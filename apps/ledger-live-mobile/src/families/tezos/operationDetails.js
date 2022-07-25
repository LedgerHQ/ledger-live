// @flow
import type { Operation } from "@ledgerhq/live-common/types/index";

export default {
  getURLWhatIsThis: (op: Operation) =>
    op.type !== "IN" && op.type !== "OUT"
      ? "https://support.ledger.com/hc/en-us/articles/360010769019"
      : null,
};
