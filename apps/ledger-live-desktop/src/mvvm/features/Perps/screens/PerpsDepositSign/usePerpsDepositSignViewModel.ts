import { useCallback, useEffect, useRef } from "react";
import { cancelDepositRequest } from "@ledgerhq/live-common/wallet-api/Perps/depositRequest";
import {
  usePerpsDepositExecution,
  type PerpsDepositDeviceStep,
} from "LLD/features/Perps/hooks/usePerpsDepositExecution";
import { isUserRefusal } from "LLD/features/Perps/utils/isUserRefusal";
import { openPerpsDeposit } from "../PerpsDeposit/PerpsDepositDialog";
import { openPerpsReview } from "../PerpsReview/PerpsReviewDialog";
import type { PerpsReviewData } from "../PerpsReview/usePerpsReviewViewModel";

export type PerpsDepositSignData = PerpsReviewData;

export type PerpsDepositSignViewModel = {
  deviceStep: PerpsDepositDeviceStep;
  retry: () => void;
  onClose: () => void;
  onDismiss: () => void;
  /** Errors raised while connecting to the device, which never reach the execution. */
  onDeviceError: (error: Error) => void;
  onOpenManager: () => void;
};

export function usePerpsDepositSignViewModel(
  data: PerpsDepositSignData,
  onClose: () => void,
): PerpsDepositSignViewModel {
  const handleRefused = useCallback(() => {
    openPerpsReview(data);
    onClose();
  }, [data, onClose]);

  const returnToDeposit = useCallback(() => {
    openPerpsDeposit({ receiverAccount: data.receiverAccount, draft: data.draft });
    onClose();
  }, [data.draft, data.receiverAccount, onClose]);

  const { deviceStep, executeDeposit, retry } = usePerpsDepositExecution(data, {
    onDone: onClose,
    onRefused: handleRefused,
    onNotEnoughBalance: returnToDeposit,
  });

  const onDeviceError = useCallback(
    (error: Error) => {
      if (isUserRefusal(error)) handleRefused();
    },
    [handleRefused],
  );

  const onDismiss = useCallback(() => {
    cancelDepositRequest();
    onClose();
  }, [onClose]);

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
    onDismiss,
    onDeviceError,
    // Opening My Ledger leaves the flow, like a dismiss.
    onOpenManager: onDismiss,
  };
}
