import type { SendTransactionStatus } from "../../registry";
import BigNumber from "bignumber.js";

export type StatusWithTxOutputs = SendTransactionStatus & {
  txOutputs?: ReadonlyArray<{ isChange: boolean; value: BigNumber }>;
};

export function hasTxOutputs(status: SendTransactionStatus): status is StatusWithTxOutputs {
  return "txOutputs" in status;
}

/** Bitcoin status includes txOutputs with change; generic status may not. */
export function getChangeToReturn(status: SendTransactionStatus): BigNumber {
  const outputs = hasTxOutputs(status) ? (status.txOutputs ?? []) : [];
  return outputs
    .filter((o): o is { isChange: true; value: BigNumber } => o.isChange)
    .reduce((sum, o) => sum.plus(o.value), new BigNumber(0));
}
