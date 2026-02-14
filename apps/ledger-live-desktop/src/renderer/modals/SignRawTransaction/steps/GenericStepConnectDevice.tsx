import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import DeviceAction from "~/renderer/components/DeviceAction";
import StepProgress from "~/renderer/components/StepProgress";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import { AppRequest } from "@ledgerhq/live-common/hw/actions/app";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { useRawTransactionAction } from "~/renderer/hooks/useConnectAppAction";

const Result = (
  result:
    | {
        signedOperation: SignedOperation | undefined | null;
        device: Device;
      }
    | {
        transactionSignError: Error;
      },
) => {
  if (!("signedOperation" in result) || !result.signedOperation) return null;
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
  broadcast,
  useApp,
  transitionTo,
  onTransactionSigned,
  onTransactionError,
  dependencies,
  requireLatestFirmware,
  manifestId,
  manifestName,
  location,
}: {
  transitionTo: (a: string) => void;
  account: AccountLike;
  parentAccount: Account | undefined | null;
  transaction: string;
  broadcast?: boolean;
  useApp?: string;
  onTransactionError: (a: Error) => void;
  onTransactionSigned: (a: SignedOperation) => void;
  dependencies?: AppRequest[];
  requireLatestFirmware?: boolean;
  manifestId?: string;
  manifestName?: string;
  location?: HOOKS_TRACKING_LOCATIONS;
}) {
  const action = useRawTransactionAction();
  const request = useMemo(
    () => ({
      parentAccount,
      account,
      appName: useApp,
      transaction,
      broadcast,
      dependencies,
      requireLatestFirmware,
      manifestId,
      manifestName,
    }),
    [
      account,
      broadcast,
      dependencies,
      manifestId,
      manifestName,
      parentAccount,
      requireLatestFirmware,
      transaction,
      useApp,
    ],
  );
  if (!transaction || !account) return null;
  return (
    <DeviceAction
      action={action}
      request={request}
      Result={Result}
      onResult={result => {
        if ("signedOperation" in result) {
          onTransactionSigned(result.signedOperation);
        } else if ("transactionSignError" in result) {
          onTransactionError(result.transactionSignError);
          transitionTo("confirmation");
        }
      }}
      location={location}
    />
  );
}
