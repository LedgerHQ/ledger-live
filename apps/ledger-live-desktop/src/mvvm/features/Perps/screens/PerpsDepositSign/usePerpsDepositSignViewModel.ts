import { useCallback, useEffect, useRef } from "react";
import { cancelDepositRequest } from "@ledgerhq/live-common/wallet-api/Perps/deposit/request";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { PERPS_SWAPKIT_PROVIDER } from "@ledgerhq/live-common/wallet-api/Perps/constants";
import {
  usePerpsDepositExecution,
  type PerpsDepositDeviceStep,
  type PerpsDepositOutcome,
} from "LLD/features/Perps/hooks/usePerpsDepositExecution";
import { openPerpsTransactionSigned } from "../PerpsTransactionSigned/PerpsTransactionSignedDialog";
import { isUserRefusal } from "@ledgerhq/live-common/wallet-api/Perps/isUserRefusal";
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

  const handleDone = useCallback(
    ({ swapId }: PerpsDepositOutcome) => {
      openPerpsTransactionSigned({
        receiveCurrencyTicker: getAccountCurrency(data.receiverAccount).ticker,
        swapId,
        provider: PERPS_SWAPKIT_PROVIDER,
      });
      onClose();
    },
    [data.receiverAccount, onClose],
  );

  const { deviceStep, executeDeposit, retry } = usePerpsDepositExecution(data, {
    onDone: handleDone,
    onRefused: handleRefused,
    onReturnToForm: returnToDeposit,
  });

  const onDeviceError = useCallback(
    (error: Error) => {
      if (isUserRefusal(error)) handleRefused();
    },
    [handleRefused],
  );

  const onDismiss = useCallback(() => {
    if (deviceStep.kind === "error" && deviceStep.returnsToForm) {
      returnToDeposit();
      return;
    }
    cancelDepositRequest();
    onClose();
  }, [deviceStep, onClose, returnToDeposit]);

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
