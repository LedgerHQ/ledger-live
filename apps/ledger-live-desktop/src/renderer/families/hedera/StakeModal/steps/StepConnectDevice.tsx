// @flow

// NOTE: This component is also used for the "Stop Stake" flow

import React from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { getEnv } from "@ledgerhq/live-common/env";
import { createAction } from "@ledgerhq/live-common/hw/actions/transaction";

import { command } from "~/renderer/commands";
import { useBroadcast } from "~/renderer/hooks/useBroadcast";
import { closeModal } from "~/renderer/actions/modals";

import DeviceAction from "~/renderer/components/DeviceAction";
import StepProgress from "~/renderer/components/StepProgress";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";

import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { SignedOperation } from "@ledgerhq/live-common/types";
import type { StepProps } from "../types";

const connectAppExec = command("connectApp");
const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectAppExec);

const Result = ({
  signedOperation,
  device,
}: {
  signedOperation: ?SignedOperation,
  device: Device,
}) => {
  if (!signedOperation) return null;
  return (
    <StepProgress modelId={device.modelId}>
      <DeviceBlocker />
      <Trans i18nKey="send.steps.confirmation.pending.title" />
    </StepProgress>
  );
};

export default function StepConnectDevice({
  account,
  parentAccount,
  transaction,
  status,
  transitionTo,
  onOperationBroadcasted,
  onTransactionError,
  setSigned,
  onConfirmationHandler,
  onFailHandler,
  name,
}: StepProps) {
  const dispatch = useDispatch();
  const broadcast = useBroadcast({ account, parentAccount });

  if (!transaction || !account) return null;

  return (
    <DeviceAction
      action={action}
      request={{
        parentAccount,
        account,
        transaction,
        status,
      }}
      Result={Result}
      onResult={({ signedOperation, transactionSignError }) => {
        if (signedOperation) {
          setSigned(true);
          broadcast(signedOperation).then(
            operation => {
              if (!onConfirmationHandler) {
                onOperationBroadcasted(operation);
                transitionTo("success");
              } else {
                dispatch(closeModal(name));
                onConfirmationHandler(operation);
              }
            },
            error => {
              if (!onFailHandler) {
                onTransactionError(error);
                transitionTo("success");
              } else {
                dispatch(closeModal(name));
                onFailHandler(error);
              }
            },
          );
        } else if (transactionSignError) {
          if (!onFailHandler) {
            onTransactionError(transactionSignError);
            transitionTo("success");
          } else {
            dispatch(closeModal(name));
            onFailHandler(transactionSignError);
          }
        }
      }}
      analyticsPropertyFlow="stake"
    />
  );
}
