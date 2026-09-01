import { useCallback, useEffect, useRef } from "react";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { PerpsDepositReviewParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import type { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import {
  usePerpsDepositExecution,
  type PerpsDepositDeviceStep,
} from "LLM/features/Perps/hooks/usePerpsDepositExecution";
import { isUserRefusal } from "LLM/features/Perps/utils/isUserRefusal";

/** The sheet owns no navigation header, so pairing's header requests are dropped. */
const ignoreHeaderOptions = (_request: SetHeaderOptionsRequest) => undefined;

/** Mounted only while signing, so opening and closing is the caller's business. */
export type PerpsDepositSignProps = Readonly<PerpsDepositReviewParams> &
  Readonly<{
    /**
     * The device to sign on, held by the deposit screen so that it outlives a
     * single attempt. Signing again after a decline then skips the device list.
     */
    selectedDevice: Device | null | undefined;
    onSelectDevice: (device: Device | null | undefined) => void;
    /** The deposit landed. */
    onDone: () => void;
    /** The holder backed out, so the summary they came from comes back. */
    onRefused: () => void;
  }>;

export type PerpsDepositSignViewModel = Readonly<{
  selectedDevice: Device | null | undefined;
  deviceStep: PerpsDepositDeviceStep;
  setSelectedDevice: (device: Device | null | undefined) => void;
  retry: () => void;
  /** Errors raised while connecting to the device, which never reach the execution. */
  onDeviceError: (error: Error) => void;
  handleDrawerClose: () => void;
  ignoreHeaderOptions: (request: SetHeaderOptionsRequest) => void;
}>;

export function usePerpsDepositSignViewModel({
  selectedDevice,
  onSelectDevice,
  onDone,
  onRefused,
  ...depositParams
}: PerpsDepositSignProps): PerpsDepositSignViewModel {
  const { deviceStep, executeDeposit, retry } = usePerpsDepositExecution(depositParams, {
    onDone,
    onRefused,
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
    setSelectedDevice: onSelectDevice,
    retry,
    onDeviceError,
    handleDrawerClose: onRefused,
    ignoreHeaderOptions,
  };
}
