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
  swapAppVersion,
  fromAccountAddress,
  toAccountAddress,
  fromAmount,
}: {
  result: { operation: Operation | string; swapId: string };
  provider: string;
  sourceCurrencyId?: string;
  targetCurrencyId?: string;
  hardwareWalletType?: DeviceModelId;
  swapType?: TradeMethod;
  swapAppVersion?: string;
  fromAccountAddress?: string;
  toAccountAddress?: string;
  fromAmount?: string;
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
      swapAppVersion,
      fromAccountAddress,
      toAccountAddress,
      fromAmount,
    });
  } else {
    postSwapAccepted({
      provider,
      swapId,
      transactionId: typeof operation === "string" ? operation : operation.hash,
      sourceCurrencyId,
      targetCurrencyId,
      hardwareWalletType,
      swapType,
      swapAppVersion,
      fromAccountAddress,
      toAccountAddress,
      fromAmount,
    });
  }
};
