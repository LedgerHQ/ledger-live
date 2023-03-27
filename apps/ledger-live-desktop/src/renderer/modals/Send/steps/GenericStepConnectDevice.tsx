import React from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import DeviceAction from "~/renderer/components/DeviceAction";
import StepProgress from "~/renderer/components/StepProgress";
import { createAction } from "@ledgerhq/live-common/hw/actions/transaction";
import { useBroadcast } from "~/renderer/hooks/useBroadcast";
import { Account, AccountLike, Operation, SignedOperation } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getEnv } from "@ledgerhq/live-common/env";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { closeModal } from "~/renderer/actions/modals";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectApp);
const Result = ({
  signedOperation,
  device,
}: {
  signedOperation: SignedOperation | undefined | null;
  device: Device;
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
}: {
  transitionTo: (a: string) => void;
  account: AccountLike | undefined | null;
  parentAccount: Account | undefined | null;
  transaction: Transaction | undefined | null;
  status: TransactionStatus;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  setSigned: (a: boolean) => void;
  onConfirmationHandler?: Function;
  onFailHandler?: Function;
}) {
  const dispatch = useDispatch();
  const broadcast = useBroadcast({
    account,
    parentAccount,
  });
  const tokenCurrency = account && account.type === "TokenAccount" && account.token;
  if (!transaction || !account) return null;
  return (
    <DeviceAction
      action={action}
      request={{
        tokenCurrency,
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
                transitionTo("confirmation");
              } else {
                dispatch(closeModal("MODAL_SEND"));
                onConfirmationHandler(operation);
              }
            },
            error => {
              if (!onFailHandler) {
                onTransactionError(error);
                transitionTo("confirmation");
              } else {
                dispatch(closeModal("MODAL_SEND"));
                onFailHandler(error);
              }
            },
          );
        } else if (transactionSignError) {
          if (!onFailHandler) {
            onTransactionError(transactionSignError);
            transitionTo("confirmation");
          } else {
            dispatch(closeModal("MODAL_SEND"));
            onFailHandler(transactionSignError);
          }
        }
      }}
      analyticsPropertyFlow="send"
    />
  );
}
