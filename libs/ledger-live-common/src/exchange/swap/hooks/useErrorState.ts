import { Result } from "../../../bridge/useBridgeTransaction";
import { SwapFeeEstimationFailed } from "../../../errors";
import { Transaction } from "../../../generated/types";

const GAS_FEES_NETWORK_PATH = "/estimate-gas-limit";

export function useErrorState<T extends Transaction = Transaction>({
  status,
  bridgeError,
  transaction,
}: Result<T>) {
  const errors = { ...status.errors };
  if (!transaction?.amount.gt(0)) return {};

  if (bridgeError?.config) {
    const bridgeErrorURL = bridgeError.config.url;
    if (bridgeErrorURL.includes(GAS_FEES_NETWORK_PATH)) {
      errors.gasNetworkError = new SwapFeeEstimationFailed();
    }
  }

  return errors;
}
