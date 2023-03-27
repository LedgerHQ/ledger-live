/* eslint-disable consistent-return */
import { Operation } from "@ledgerhq/types-live";
const helpURL = "https://support.ledger.com/hc/en-us/articles/360010653260";
function getURLFeesInfo(op: Operation, currencyId: string): string | undefined | null {
  if (op.fee.gt(200000)) {
    return helpURL;
  }
}
function getURLWhatIsThis(op: Operation, currencyId: string): string | undefined | null {
  if (op.type !== "IN" && op.type !== "OUT") {
    return helpURL;
  }
}
export default {
  getURLFeesInfo,
  getURLWhatIsThis,
};
