import { getEnv } from "@ledgerhq/live-env";
import { Operation } from "@ledgerhq/types-live";
import { postSwapAccepted, postSwapCancelled } from "./index";
import { DeviceModelId } from "@ledgerhq/devices";
import { TradeMethod } from "./types";

export const setBroadcastTransaction = ({
  result,
  provider,
  sourceCurrencyId,
  targetCurrencyId,
  hardwareWalletType,
  swapType,
}: {
  result: { operation: Operation; swapId: string };
  provider: string;
  sourceCurrencyId?: string;
  targetCurrencyId?: string;
  hardwareWalletType?: DeviceModelId;
  swapType?: TradeMethod;
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
      swapStep: "SIGN_COIN_TRANSACTION",
      statusCode: "DISABLE_TRANSACTION_BROADCAST",
      errorMessage: "DISABLE_TRANSACTION_BROADCAST",
      sourceCurrencyId,
      targetCurrencyId,
      hardwareWalletType,
      swapType: swapType,
    });
  } else {
    postSwapAccepted({
      provider,
      swapId,
      transactionId: operation.hash,
      sourceCurrencyId,
      targetCurrencyId,
      hardwareWalletType,
      swapType,
    });
  }
};
