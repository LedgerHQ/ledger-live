import { SwapFeeEstimationFailed } from "@ledgerhq/errors";
import { Result } from "../../../bridge/useBridgeTransaction";

import { Transaction } from "../../../generated/types";

const GAS_FEES_NETWORK_PATH = "/estimate-gas-limit";

type BridgeErrorWithConfig = Error & {
  config?: {
    url: string;
  };
};

export function useErrorState<T extends Transaction = Transaction>({
  status,
  bridgeError,
  transaction,
}: Result<T>) {
  const errors = { ...status.errors };
  const _bridgeError = bridgeError as BridgeErrorWithConfig;

  if (_bridgeError?.config && transaction?.amount.gt(0)) {
    const bridgeErrorURL = _bridgeError.config.url;
    if (bridgeErrorURL.includes(GAS_FEES_NETWORK_PATH)) {
      errors.gasNetworkError = new SwapFeeEstimationFailed();
    }
  }

  return errors;
}
