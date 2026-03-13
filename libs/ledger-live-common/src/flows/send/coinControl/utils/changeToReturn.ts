import type { TransactionStatus } from "../../../../generated/types";
import { BigNumber } from "bignumber.js";

export type StatusWithTxOutputs = TransactionStatus & {
  txOutputs?: ReadonlyArray<{ isChange: boolean; value: BigNumber }>;
};

export function hasTxOutputs(status: TransactionStatus): status is StatusWithTxOutputs {
  return "txOutputs" in status;
}

/** Bitcoin status includes txOutputs with change; generic status may not. */
export function getChangeToReturn(status: TransactionStatus): BigNumber {
  const outputs = hasTxOutputs(status) ? status.txOutputs ?? [] : [];
  return outputs
    .filter((o): o is { isChange: true; value: BigNumber } => o.isChange)
    .reduce((sum, o) => sum.plus(o.value), new BigNumber(0));
}
