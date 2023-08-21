import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import DeviceAction from "~/renderer/components/DeviceAction";
import StepProgress from "~/renderer/components/StepProgress";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { createAction } from "@ledgerhq/live-common/hw/actions/transaction";
import { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { AppRequest } from "@ledgerhq/live-common/hw/actions/app";
import { getEnv } from "@ledgerhq/live-env";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectApp);
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
  useApp,
  status,
  transitionTo,
  onTransactionSigned,
  onTransactionError,
  dependencies,
  requireLatestFirmware,
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
}) {
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
    }),
    [
      account,
      dependencies,
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
    />
  );
}
