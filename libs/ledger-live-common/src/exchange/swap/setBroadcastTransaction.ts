import { getEnv } from "@ledgerhq/live-env";
import { Operation } from "@ledgerhq/types-live";
import { postSwapAccepted, postSwapCancelled } from "./index";
import { DeviceModelId } from "@ledgerhq/devices";

export const setBroadcastTransaction = ({
  result,
  provider,
  sourceCurrencyId,
  targetCurrencyId,
  hardwareWalletType,
}: {
  result: { operation: Operation; swapId: string };
  provider: string;
  sourceCurrencyId?: string;
  targetCurrencyId?: string;
  hardwareWalletType?: DeviceModelId;
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
      sourceCurrencyId,
      targetCurrencyId,
      hardwareWalletType,
    });
  }
};
