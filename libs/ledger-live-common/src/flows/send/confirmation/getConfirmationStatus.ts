import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { sendFeatures } from "../../../bridge/descriptor/send/features";
import { FLOW_STATUS, type FlowStatus } from "../../wizard/types";
import type { SendFlowOperationResult } from "../types";

export function getConfirmationStatus(
  operation: SendFlowOperationResult,
  currency: CryptoOrTokenCurrency | null,
): FlowStatus {
  const { signed, optimisticOperation, transactionError } = operation;

  if (signed && optimisticOperation) {
    return FLOW_STATUS.SUCCESS;
  }

  if (signed && transactionError && !optimisticOperation) {
    return FLOW_STATUS.ERROR;
  } else if (!signed && transactionError) {
    if (currency && sendFeatures.isUserRefusedTransactionError(currency, transactionError)) {
      return FLOW_STATUS.IDLE;
    }
    return FLOW_STATUS.ERROR;
  }
  return FLOW_STATUS.IDLE;
}
