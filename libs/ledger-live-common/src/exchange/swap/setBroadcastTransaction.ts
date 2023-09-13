import { getEnv } from "@ledgerhq/live-env";
import { Operation } from "@ledgerhq/types-live";
import { postSwapAccepted, postSwapCancelled } from "./index";

export const setBroadcastTransaction = ({
  result,
  provider,
}: {
  result: { operation: Operation; swapId: string };
  provider: string;
}) => {
  const { operation, swapId } = result;

  /**
   * If transaction broadcast are disabled, consider the swap as cancelled
   * since the partner will never receive the funds
   */
  if (getEnv("DISABLE_TRANSACTION_BROADCAST")) {
    postSwapCancelled({
      provider,
      swapId,
    });
  } else {
    postSwapAccepted({
      provider,
      swapId,
      transactionId: operation.hash,
    });
  }
};
