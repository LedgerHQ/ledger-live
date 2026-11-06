import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { PerpsWithdrawResult } from "@ledgerhq/live-common/wallet-api/Perps/server";
import {
  executePerpsWithdraw,
  isPerpsWithdrawRetryable,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/execute";
import { getWithdrawRequestId } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/request";
import { PERPS_WITHDRAW_SIGNING_APP_NAME } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/sign";
import { getPerpsWithdrawHistoryUpdate } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/history";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { useDispatch } from "~/context/hooks";
import type { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import { isUserRefusal } from "LLM/features/Perps/utils/isUserRefusal";
import type { PerpsWithdrawSummaryParams } from "../PerpsWithdrawSummary";

const ignoreHeaderOptions = (_request: SetHeaderOptionsRequest) => undefined;

export type PerpsWithdrawSignProps = Readonly<PerpsWithdrawSummaryParams> &
  Readonly<{
    selectedDevice: Device | null | undefined;
    onSelectDevice: (device: Device | null | undefined) => void;
    onDone: (result: PerpsWithdrawResult) => void;
    onRefused: () => void;
    /** The withdraw failed for good, so the flow ends. */
    onLeave: () => void;
  }>;

export type PerpsWithdrawSignStep =
  | { kind: "connect" }
  | { kind: "sign"; device: Device }
  | { kind: "submitting" }
  | { kind: "error"; error: Error; canRetry: boolean };

export type PerpsWithdrawSignViewModel = Readonly<{
  selectedDevice: Device | null | undefined;
  step: PerpsWithdrawSignStep;
  /** Bumped on retry, so the device connection starts over. */
  attempt: number;
  action: ReturnType<typeof useAppDeviceAction>;
  request: { appName: string };
  setSelectedDevice: (device: Device | null | undefined) => void;
  handleDeviceResult: (result: AppResult) => void;
  /** Errors raised while connecting to the device, which never reach the withdraw. */
  handleDeviceError: (error: Error) => void;
  retry: () => void;
  handleDrawerClose: () => void;
  onLeave: () => void;
  ignoreHeaderOptions: (request: SetHeaderOptionsRequest) => void;
}>;

export function usePerpsWithdrawSignViewModel({
  selectedDevice,
  onSelectDevice,
  onDone,
  onRefused,
  onLeave,
  sourceAccount,
  destinationAccount,
  quote,
  quoteParams,
}: PerpsWithdrawSignProps): PerpsWithdrawSignViewModel {
  const [step, setStep] = useState<PerpsWithdrawSignStep>({ kind: "connect" });
  const [attempt, setAttempt] = useState(0);
  const dispatch = useDispatch();
  const action = useAppDeviceAction();
  const request = useMemo(() => ({ appName: PERPS_WITHDRAW_SIGNING_APP_NAME }), []);

  // Captured on open, so a newer withdraw request is never settled by this one.
  const requestIdRef = useRef(getWithdrawRequestId());
  const isLeavingRef = useRef(false);
  useEffect(
    () => () => {
      isLeavingRef.current = true;
    },
    [],
  );

  // The sheet reports its own close too, so only the first way out counts.
  const leave = useCallback((callback: () => void) => {
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;
    callback();
  }, []);

  const handleDeviceResult = useCallback(
    async ({ device }: AppResult) => {
      setStep({ kind: "sign", device });
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
            if (!isLeavingRef.current) setStep({ kind: "submitting" });
          },
        });
        // Recorded even when the sheet was closed meanwhile: the withdraw went through.
        if (result.swapId) {
          dispatch(
            updateAccountWithUpdater(
              getPerpsWithdrawHistoryUpdate({
                swapId: result.swapId,
                sourceAccount,
                destinationAccount,
                amountFrom: new BigNumber(quoteParams.amount),
                amountTo: quote.amountTo,
                payoutNetworkFees: quote.payoutNetworkFees,
              }),
            ),
          );
        }
        leave(() => onDone(result));
      } catch (e) {
        if (isLeavingRef.current) return;
        if (isUserRefusal(e)) {
          leave(onRefused);
          return;
        }
        const error = e instanceof Error ? e : new Error(String(e));
        setStep({ kind: "error", error, canRetry: isPerpsWithdrawRetryable(error) });
      }
    },
    [
      destinationAccount,
      dispatch,
      leave,
      onDone,
      onRefused,
      quote,
      quoteParams.amount,
      sourceAccount,
    ],
  );

  const handleDeviceError = useCallback(
    (error: Error) => {
      if (isUserRefusal(error)) leave(onRefused);
    },
    [leave, onRefused],
  );

  const retry = useCallback(() => {
    setAttempt(current => current + 1);
    setStep({ kind: "connect" });
  }, []);

  // A withdraw that can no longer be retried ends the flow; otherwise the summary comes back.
  // Mid-signature the device or the submit decides, so a stray close (e.g. back) changes nothing.
  const handleDrawerClose = useCallback(() => {
    if (step.kind === "sign" || step.kind === "submitting") return;
    leave(step.kind === "error" && !step.canRetry ? onLeave : onRefused);
  }, [leave, onLeave, onRefused, step]);

  const handleLeave = useCallback(() => leave(onLeave), [leave, onLeave]);
  const handleResult = useCallback(
    (result: AppResult) => void handleDeviceResult(result),
    [handleDeviceResult],
  );

  return {
    selectedDevice,
    step,
    attempt,
    action,
    request,
    setSelectedDevice: onSelectDevice,
    handleDeviceResult: handleResult,
    handleDeviceError,
    retry,
    handleDrawerClose,
    onLeave: handleLeave,
    ignoreHeaderOptions,
  };
}
