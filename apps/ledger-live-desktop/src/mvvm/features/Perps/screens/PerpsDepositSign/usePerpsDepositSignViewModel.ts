import { useCallback, useEffect, useRef } from "react";
import {
  usePerpsDepositExecution,
  type PerpsDepositDeviceStep,
} from "LLD/features/Perps/hooks/usePerpsDepositExecution";
import { isUserRefusal } from "LLD/features/Perps/utils/isUserRefusal";
import { openPerpsReview } from "../PerpsReview/PerpsReviewDialog";
import type { PerpsReviewData } from "../PerpsReview/usePerpsReviewViewModel";

export type PerpsDepositSignData = PerpsReviewData;

export type PerpsDepositSignViewModel = {
  deviceStep: PerpsDepositDeviceStep;
  retry: () => void;
  onClose: () => void;
  /** Errors raised while connecting to the device, which never reach the execution. */
  onDeviceError: (error: Error) => void;
};

export function usePerpsDepositSignViewModel(
  data: PerpsDepositSignData,
  onClose: () => void,
): PerpsDepositSignViewModel {
  const handleRefused = useCallback(() => {
    openPerpsReview(data);
    onClose();
  }, [data, onClose]);

  const { deviceStep, executeDeposit, retry } = usePerpsDepositExecution(data, {
    onDone: onClose,
    onRefused: handleRefused,
  });

  const onDeviceError = useCallback(
    (error: Error) => {
      if (isUserRefusal(error)) handleRefused();
    },
    [handleRefused],
  );

  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void executeDeposit();
  }, [executeDeposit]);

  return {
    deviceStep,
    retry,
    onClose,
    onDeviceError,
  };
}
