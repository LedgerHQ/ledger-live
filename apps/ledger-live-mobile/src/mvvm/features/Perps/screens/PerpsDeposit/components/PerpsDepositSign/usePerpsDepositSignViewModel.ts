import { useCallback, useEffect, useRef } from "react";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { PerpsDepositReviewParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { isDepositGenericSignError } from "@ledgerhq/live-common/wallet-api/Perps/deposit/signError";
import type { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import {
  usePerpsDepositExecution,
  type PerpsDepositDeviceStep,
  type PerpsDepositOutcome,
} from "LLM/features/Perps/hooks/usePerpsDepositExecution";
import { isUserRefusal } from "LLM/features/Perps/utils/isUserRefusal";

const ignoreHeaderOptions = (_request: SetHeaderOptionsRequest) => undefined;

export type PerpsDepositSignProps = Readonly<PerpsDepositReviewParams> &
  Readonly<{
    selectedDevice: Device | null | undefined;
    onSelectDevice: (device: Device | null | undefined) => void;
    onDone: (outcome: PerpsDepositOutcome) => void;
    onRefused: () => void;
    onReturnToForm: () => void;
  }>;

export type PerpsDepositSignViewModel = Readonly<{
  selectedDevice: Device | null | undefined;
  deviceStep: PerpsDepositDeviceStep;
  isGenericError: boolean;
  setSelectedDevice: (device: Device | null | undefined) => void;
  retry: () => void;
  onDeviceError: (error: Error) => void;
  handleDrawerClose: () => void;
  ignoreHeaderOptions: (request: SetHeaderOptionsRequest) => void;
}>;

export function usePerpsDepositSignViewModel({
  selectedDevice,
  onSelectDevice,
  onDone,
  onRefused,
  onReturnToForm,
  ...depositParams
}: PerpsDepositSignProps): PerpsDepositSignViewModel {
  const isLeavingRef = useRef(false);

  const handleReturnToForm = useCallback(() => {
    isLeavingRef.current = true;
    onReturnToForm();
  }, [onReturnToForm]);

  const handleDone = useCallback(
    (outcome: PerpsDepositOutcome) => {
      isLeavingRef.current = true;
      onDone(outcome);
    },
    [onDone],
  );

  const handleDrawerClose = useCallback(() => {
    if (isLeavingRef.current) return;
    onRefused();
  }, [onRefused]);

  const { deviceStep, executeDeposit, retry } = usePerpsDepositExecution(depositParams, {
    onDone: handleDone,
    onRefused,
    onReturnToForm: handleReturnToForm,
  });

  const onDeviceError = useCallback(
    (error: Error) => {
      if (isUserRefusal(error)) onRefused();
    },
    [onRefused],
  );

  const startedRef = useRef(false);
  useEffect(() => {
    if (!selectedDevice || startedRef.current) return;
    startedRef.current = true;
    void executeDeposit();
  }, [executeDeposit, selectedDevice]);

  return {
    selectedDevice,
    deviceStep,
    isGenericError: deviceStep.kind === "error" && isDepositGenericSignError(deviceStep.error),
    setSelectedDevice: onSelectDevice,
    retry,
    onDeviceError,
    handleDrawerClose,
    ignoreHeaderOptions,
  };
}
