import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";

import { Device } from "@ledgerhq/live-common/hw/actions/types";
import DeviceAction from "~/renderer/components/DeviceAction";
import StepProgress from "~/renderer/components/StepProgress";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { Account, AccountLike, Operation, SignedOperation } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { closeModal } from "~/renderer/actions/modals";
import { mevProtectionSelector } from "~/renderer/reducers/settings";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { useTransactionAction } from "~/renderer/hooks/useConnectAppAction";

const Result = (
  props:
    | {
        signedOperation: SignedOperation | undefined | null;
        device: Device;
      }
    | {
        transactionSignError: Error;
      },
) => {
  if (!("signedOperation" in props)) return null;
  return (
    <StepProgress>
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
  account?: AccountLike | undefined | null;
  parentAccount?: Account | undefined | null;
  transaction?: Transaction | undefined | null;
  status: TransactionStatus;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  setSigned: (a: boolean) => void;
  onConfirmationHandler?: (operation: Operation) => void;
  onFailHandler?: (error: Error) => void;
}) {
  const mevProtected = useSelector(mevProtectionSelector);
  const dispatch = useDispatch();
  const broadcastConfig = useMemo(() => ({ mevProtected }), [mevProtected]);
  const broadcast = useBroadcast({
    account,
    parentAccount,
    broadcastConfig,
  });
  const tokenCurrency = (account && account.type === "TokenAccount" && account.token) || undefined;
  const request = useMemo(
    () => ({
      tokenCurrency,
      parentAccount,
      account,
      transaction,
      status,
    }),
    [account, parentAccount, status, tokenCurrency, transaction],
  );
  const action = useTransactionAction();
  if (!transaction || !account) return null;

  return (
    <DeviceAction
      action={action}
      // @ts-expect-error This type is not compatible with the one expected by the action
      request={request}
      Result={Result}
      onResult={result => {
        if ("signedOperation" in result) {
          const { signedOperation } = result;
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
        } else if ("transactionSignError" in result) {
          const { transactionSignError } = result;
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
      location={HOOKS_TRACKING_LOCATIONS.sendModal}
    />
  );
}
