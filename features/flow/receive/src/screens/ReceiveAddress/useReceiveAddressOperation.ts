import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  annotateOperation,
  failOperation,
  startOperation,
  succeedOperation,
  type OperationAttributes,
  type OperationId,
} from "@shared/observability-operations";
import {
  toReceiveAddressLeaveEnding,
  toReceiveAddressProgress,
  toReceiveAddressRetryEnding,
  type ReceiveAddressLeaveTrigger,
  type ReceiveAddressScreen,
} from "../../logic/receiveAddressOperationSteps";
import {
  RECEIVE_ADDRESS_OPERATION,
  type ReceiveOperationEnding,
} from "../../logic/receiveOperations";
import type { ReceiveAddressProps } from "./ReceiveAddress.types";
import type { AddressSanctionStatus } from "./useAddressSanctionCheck";
import type { ReceiveAddressHeader } from "./useReceiveAddressHeader";
import type { ReceiveAddressSelection } from "./useReceiveAddressSelection";
import type { ReceiveScreenData } from "./useReceiveScreenData";

type OperationRun = {
  id: OperationId | null;
  attempt: number;
  isFinished: boolean;
  wasGated: boolean;
  gateActionOpened: boolean;
  startAttributes: OperationAttributes;
  screen: ReceiveAddressScreen;
};

type Params = Pick<
  ReceiveAddressProps,
  "assetId" | "source" | "serviceIncidents" | "onClose" | "onResolveGate"
> &
  Pick<ReceiveAddressHeader, "asset" | "network"> &
  Readonly<{
    data: ReceiveScreenData;
    selection: Pick<ReceiveAddressSelection, "isSelecting" | "selected">;
    sanctionStatus: AddressSanctionStatus;
  }>;

export type ReceiveAddressOperation = Readonly<{
  onClose: () => void;
  onResolveGate: ReceiveAddressProps["onResolveGate"];
  onRetry: () => void;
}>;

function startAttempt(run: OperationRun): void {
  run.wasGated = false;
  run.gateActionOpened = false;
  run.id = startOperation(RECEIVE_ADDRESS_OPERATION, {
    attributes: { ...run.startAttributes, attempt: run.attempt },
  });
}

function annotateAttempt(run: OperationRun, attributes: OperationAttributes): void {
  if (run.id === null) return;
  annotateOperation(RECEIVE_ADDRESS_OPERATION, { attributes, expectedId: run.id });
}

function stopAttempt(run: OperationRun, ending: ReceiveOperationEnding): void {
  const { id } = run;
  if (id === null) return;
  run.id = null;
  if (ending.type === "succeed") {
    succeedOperation(RECEIVE_ADDRESS_OPERATION, { attributes: ending.attributes, expectedId: id });
    return;
  }
  failOperation(RECEIVE_ADDRESS_OPERATION, ending.reason, {
    attributes: ending.attributes,
    expectedId: id,
  });
}

function finish(run: OperationRun, ending: ReceiveOperationEnding): void {
  run.isFinished = true;
  stopAttempt(run, ending);
}

function leave(run: OperationRun, trigger: ReceiveAddressLeaveTrigger): void {
  const ending = toReceiveAddressLeaveEnding(run.screen, trigger, run);
  if (trigger === "close") finish(run, ending);
  else stopAttempt(run, ending);
}

export function useReceiveAddressOperation({
  assetId,
  source,
  serviceIncidents,
  onClose,
  onResolveGate,
  asset,
  network,
  data,
  selection,
  sanctionStatus,
}: Params): ReceiveAddressOperation {
  const assetType = asset && (asset.type === "TokenCurrency" ? "token" : "coin");
  const networkId = network?.id;
  const startAttributes = useMemo(
    () => ({ currency_id: assetId, asset_type: assetType, network_id: networkId, source }),
    [assetId, assetType, networkId, source],
  );
  const screenType = data.type;
  const failedKinds = data.type === "error" ? data.failedKinds.join(",") : undefined;
  const readError = data.type === "error" ? data.readError : undefined;
  const retryRead = data.type === "error" ? data.retry : undefined;
  const { isSelecting } = selection;
  const pickedOptionId = selection.selected?.id;
  const hasServiceIncident = !!serviceIncidents?.length;
  const screen = useMemo<ReceiveAddressScreen>(
    () => ({
      type: screenType,
      isSelecting,
      pickedOptionId,
      sanctionStatus,
      hasServiceIncident,
      failedKinds,
      readError,
    }),
    [
      screenType,
      isSelecting,
      pickedOptionId,
      sanctionStatus,
      hasServiceIncident,
      failedKinds,
      readError,
    ],
  );
  const runRef = useRef<OperationRun>({
    id: null,
    attempt: 1,
    isFinished: false,
    wasGated: false,
    gateActionOpened: false,
    startAttributes,
    screen,
  });

  useEffect(() => {
    const run = runRef.current;
    run.startAttributes = startAttributes;
    run.screen = screen;
  }, [startAttributes, screen]);

  useEffect(() => {
    const run = runRef.current;
    if (run.id === null && !run.isFinished) startAttempt(run);
    return () => leave(run, "unmount");
  }, []);

  useEffect(() => {
    const run = runRef.current;
    const progress = toReceiveAddressProgress(screen, run);
    run.wasGated = progress.wasGated;
    annotateAttempt(run, { asset_type: assetType, network_id: networkId, ...progress.annotations });
    if (progress.ending) finish(run, progress.ending);
  }, [screen, assetType, networkId]);

  const closeAndLeave = useCallback(() => {
    leave(runRef.current, "close");
    onClose();
  }, [onClose]);

  const resolveGate = useMemo(
    () =>
      onResolveGate &&
      ((refreshGate: () => void) => {
        const run = runRef.current;
        run.gateActionOpened = true;
        annotateAttempt(run, { gate_action_opened: true });
        onResolveGate(refreshGate);
      }),
    [onResolveGate],
  );

  const retryAttempt = useCallback(() => {
    const run = runRef.current;
    if (!run.isFinished) {
      stopAttempt(run, toReceiveAddressRetryEnding(run.screen));
      run.attempt += 1;
      startAttempt(run);
    }
    retryRead?.();
  }, [retryRead]);

  return { onClose: closeAndLeave, onResolveGate: resolveGate, onRetry: retryAttempt };
}
