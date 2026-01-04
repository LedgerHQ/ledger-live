import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { SignedOperation } from "@ledgerhq/types-live";
import DeviceAction from "~/renderer/components/DeviceAction";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import StepProgress from "~/renderer/components/StepProgress";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { useTransactionAction } from "~/renderer/hooks/useConnectAppAction";
import { mevProtectionSelector } from "~/renderer/reducers/settings";
import type { StepProps } from "../types";

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
      <Trans i18nKey="hedera.receiveWithAssociation.steps.associationConfirmation.pending.title" />
    </StepProgress>
  );
};

export default function StepAssociationDevice(props: StepProps) {
  const {
    token,
    account,
    transaction,
    status,
    parentAccount,
    transitionTo,
    setSigned,
    onOperationBroadcasted,
    onTransactionError,
  } = props;
  const mevProtected = useSelector(mevProtectionSelector);
  const action = useTransactionAction();
  const broadcastConfig = useMemo(() => ({ mevProtected }), [mevProtected]);
  const broadcast = useBroadcast({ account, parentAccount, broadcastConfig });

  const tokenCurrency = (account && account.type === "TokenAccount" && account.token) || token;

  const request = useMemo(
    () => ({
      tokenCurrency,
      parentAccount,
      account,
      transaction,
      status,
    }),
    [tokenCurrency, parentAccount, account, transaction, status],
  );

  if (!transaction || !account) {
    return null;
  }

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
              onOperationBroadcasted(operation);
              transitionTo("associationConfirmation");
            },
            error => {
              onTransactionError(error);
              transitionTo("associationConfirmation");
            },
          );
        } else if ("transactionSignError" in result) {
          const { transactionSignError } = result;
          onTransactionError(transactionSignError);
          transitionTo("associationConfirmation");
        }
      }}
      analyticsPropertyFlow="tokenAssociation"
      location={HOOKS_TRACKING_LOCATIONS.receiveModal}
    />
  );
}
