/* eslint-disable consistent-return */
import { BigNumber } from "bignumber.js";
import { getOperationAmountNumber } from "@ledgerhq/live-common/operation";
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

// getOperationAmountNumber gives the fee for STAKE/UNSTAKE and 0 for FINALIZE_UNSTAKE, not the
// principal; show operation.value instead. STAKE is an outflow, UNSTAKE/FINALIZE return funds.
const getAmount = (operation: TezosOperation): BigNumber => {
  switch (operation.type) {
    case "STAKE":
      return operation.value.negated();
    case "UNSTAKE":
    case "FINALIZE_UNSTAKE":
      return operation.value;
    default:
      return getOperationAmountNumber(operation);
  }
};

export default {
  getURLFeesInfo,
  getURLWhatIsThis,
  OperationDetailsExtra,
  getAmount,
};
