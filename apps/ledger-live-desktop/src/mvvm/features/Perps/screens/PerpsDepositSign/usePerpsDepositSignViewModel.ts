import { useEffect, useRef } from "react";
import type { PerpsDepositReviewParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import {
  usePerpsDepositExecution,
  type PerpsDepositDeviceStep,
} from "LLD/features/Perps/hooks/usePerpsDepositExecution";

export type PerpsDepositSignData = PerpsDepositReviewParams;

export type PerpsDepositSignViewModel = {
  deviceStep: PerpsDepositDeviceStep;
  retry: () => void;
  onClose: () => void;
};

export function usePerpsDepositSignViewModel(
  data: PerpsDepositSignData,
  onClose: () => void,
): PerpsDepositSignViewModel {
  const { deviceStep, executeDeposit, retry } = usePerpsDepositExecution(data, onClose);

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
  };
}
