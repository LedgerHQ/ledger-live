/* eslint-disable consistent-return */
import React from "react";
import { BigNumber } from "bignumber.js";
import { getOperationAmountNumber } from "@ledgerhq/live-common/operation";
import { Operation } from "@ledgerhq/types-live";
import CounterValue from "~/renderer/components/CounterValue";
import FormattedVal from "~/renderer/components/FormattedVal";
import type { AmountCellProps, OperationDetailsExtraProps } from "../types";
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

// Unstaking returns funds only after a ~4-day delay, so it is not an immediate credit: render it in
// neutral text with no +/- sign to avoid reading as a gain. The real credit shows on FINALIZE_UNSTAKE.
const UnstakeAmountCell = ({
  amount,
  operation,
  currency,
  unit,
}: AmountCellProps<TezosOperation>) => (
  <>
    <FormattedVal val={amount} unit={unit} showCode fontSize={4} color="neutral.c100" />
    <CounterValue
      color="neutral.c70"
      fontSize={3}
      date={operation.date}
      currency={currency}
      value={amount}
    />
  </>
);

const amountCell = {
  UNSTAKE: UnstakeAmountCell,
};

export default {
  getURLFeesInfo,
  getURLWhatIsThis,
  OperationDetailsExtra,
  getAmount,
  amountCell,
};
