import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import DeviceAction from "~/renderer/components/DeviceAction";
import StepProgress from "~/renderer/components/StepProgress";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { AppRequest } from "@ledgerhq/live-common/hw/actions/app";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { useTransactionAction } from "~/renderer/hooks/useConnectAppAction";

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
  status,
  useApp,
  transitionTo,
  onTransactionSigned,
  onTransactionError,
  dependencies,
  requireLatestFirmware,
  manifestId,
  manifestName,
  isACRE,
  location,
}: {
  transitionTo: (a: string) => void;
  account: AccountLike | undefined | null;
  parentAccount: Account | undefined | null;
  transaction: Transaction | undefined | null;
  useApp?: string;
  status: TransactionStatus;
  onTransactionError: (a: Error) => void;
  onTransactionSigned: (a: SignedOperation) => void;
  dependencies?: AppRequest[];
  requireLatestFirmware?: boolean;
  manifestId?: string;
  manifestName?: string;
  isACRE?: boolean;
  location?: HOOKS_TRACKING_LOCATIONS;
}) {
  const action = useTransactionAction();
  const tokenCurrency = account && account.type === "TokenAccount" ? account.token : undefined;
  const request = useMemo(
    () => ({
      tokenCurrency,
      parentAccount,
      account,
      appName: useApp,
      transaction,
      status,
      dependencies,
      requireLatestFirmware,
      manifestId,
      manifestName,
      isACRE,
    }),
    [
      account,
      dependencies,
      isACRE,
      manifestId,
      manifestName,
      parentAccount,
      requireLatestFirmware,
      status,
      tokenCurrency,
      transaction,
      useApp,
    ],
  );
  if (!transaction || !account) return null;
  return (
    <DeviceAction
      action={action}
      // @ts-expect-error This type is not compatible with the one expected by the action
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
