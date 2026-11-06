import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { PERPS_SWAPKIT_PROVIDER } from "@ledgerhq/live-common/wallet-api/Perps/constants";
import {
  executePerpsWithdraw,
  isPerpsWithdrawRetryable,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/execute";
import {
  cancelWithdrawRequest,
  getWithdrawRequestId,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/request";
import { PERPS_WITHDRAW_SIGNING_APP_NAME } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/sign";
import { getPerpsWithdrawHistoryUpdate } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/history";
import { useDispatch } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";
import { isUserRefusal } from "LLD/features/Perps/utils/isUserRefusal";
import { openPerpsTransactionSigned } from "../PerpsTransactionSigned/PerpsTransactionSignedDialog";
import { openPerpsWithdrawSummary } from "../PerpsWithdrawSummary/PerpsWithdrawSummaryDialog";
import type { PerpsWithdrawSummaryData } from "../PerpsWithdrawSummary/usePerpsWithdrawSummaryViewModel";

/** The summary data, with the quote the user confirmed. */
export type PerpsWithdrawSignData = PerpsWithdrawSummaryData;

export type PerpsWithdrawSignStep =
  | { kind: "connect" }
  | { kind: "sign" }
  | { kind: "submitting" }
  | { kind: "error"; error: Error; canRetry: boolean };

export type PerpsWithdrawSignViewModel = Readonly<{
  step: PerpsWithdrawSignStep;
  /** Bumped on retry, so the device connection starts over. */
  attempt: number;
  action: ReturnType<typeof useConnectAppAction>;
  request: { appName: string };
  handleDeviceResult: (result: AppResult) => void;
  /** Errors raised while connecting to the device, which never reach the withdraw. */
  handleDeviceError: (error: Error) => void;
  retry: () => void;
  onDismiss: () => void;
}>;

export function usePerpsWithdrawSignViewModel(
  data: PerpsWithdrawSignData,
  onClose: () => void,
): PerpsWithdrawSignViewModel {
  const [step, setStep] = useState<PerpsWithdrawSignStep>({ kind: "connect" });
  const [attempt, setAttempt] = useState(0);
  const dispatch = useDispatch();
  const action = useConnectAppAction();
  const request = useMemo(() => ({ appName: PERPS_WITHDRAW_SIGNING_APP_NAME }), []);

  // Captured on open, so a newer withdraw request is never settled by this one.
  const requestIdRef = useRef(getWithdrawRequestId());
  const closedRef = useRef(false);
  useEffect(
    () => () => {
      closedRef.current = true;
    },
    [],
  );

  const backToSummary = useCallback(() => {
    openPerpsWithdrawSummary(data);
    onClose();
  }, [data, onClose]);

  const runWithdraw = useCallback(
    async (device: Device) => {
      const { sourceAccount, destinationAccount, quote, quoteParams } = data;
      setStep({ kind: "sign" });
      try {
        const result = await executePerpsWithdraw({
          requestId: requestIdRef.current,
          device,
          sourceAccount,
          quote,
          result: {
            amountFrom: quoteParams.amount,
            amountTo: quote.amountTo.toFixed(),
            toCurrencyId: getAccountCurrency(destinationAccount).id,
          },
          onSigned: () => {
            if (!closedRef.current) setStep({ kind: "submitting" });
          },
        });
        // Recorded even when the dialog was closed meanwhile: the withdraw went through.
        if (result.swapId) {
          const { accountId, updater } = getPerpsWithdrawHistoryUpdate({
            swapId: result.swapId,
            sourceAccount,
            destinationAccount,
            amountFrom: new BigNumber(quoteParams.amount),
            amountTo: quote.amountTo,
            payoutNetworkFees: quote.payoutNetworkFees,
          });
          dispatch(updateAccountWithUpdater(accountId, updater));
        }
        if (closedRef.current) return;
        openPerpsTransactionSigned({
          receiveCurrencyTicker: getAccountCurrency(destinationAccount).ticker,
          swapId: result.swapId,
          provider: PERPS_SWAPKIT_PROVIDER,
        });
        onClose();
      } catch (e) {
        if (closedRef.current) return;
        if (isUserRefusal(e)) {
          backToSummary();
          return;
        }
        const error = e instanceof Error ? e : new Error(String(e));
        setStep({ kind: "error", error, canRetry: isPerpsWithdrawRetryable(error) });
      }
    },
    [backToSummary, data, dispatch, onClose],
  );

  const handleDeviceResult = useCallback(
    (result: AppResult) => void runWithdraw(result.device),
    [runWithdraw],
  );

  const handleDeviceError = useCallback(
    (error: Error) => {
      if (isUserRefusal(error)) backToSummary();
    },
    [backToSummary],
  );

  const retry = useCallback(() => {
    setAttempt(current => current + 1);
    setStep({ kind: "connect" });
  }, []);

  // Leaving before the submit tells perps-live-app the user refused; after it, nothing changes.
  const onDismiss = useCallback(() => {
    cancelWithdrawRequest(requestIdRef.current);
    onClose();
  }, [onClose]);

  return {
    step,
    attempt,
    action,
    request,
    handleDeviceResult,
    handleDeviceError,
    retry,
    onDismiss,
  };
}
