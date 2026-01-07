/* eslint-disable consistent-return */
import { Operation } from "@ledgerhq/types-live";
import type { OperationDetailsExtraProps } from "../types";
import type { TezosAccount, TezosOperation } from "@ledgerhq/live-common/families/tezos/types";
const helpURL = "https://support.ledger.com/article/360010653260-zd";
function getURLFeesInfo({ op }: { op: Operation; currencyId: string }): string | undefined | null {
  if (op.fee.gt(200000)) {
    return helpURL;
  }
}
function getURLWhatIsThis({
  op,
}: {
  op: Operation;
  currencyId: string;
}): string | undefined | null {
  if (op.type !== "IN" && op.type !== "OUT") {
    return helpURL;
  }
}

const OperationDetailsExtra = (
  _props: OperationDetailsExtraProps<TezosAccount, TezosOperation>,
) => {
  return null;
};

export default {
  getURLFeesInfo,
  getURLWhatIsThis,
  OperationDetailsExtra,
};
