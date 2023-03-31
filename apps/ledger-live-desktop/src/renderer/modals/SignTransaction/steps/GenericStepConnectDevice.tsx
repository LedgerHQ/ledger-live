import React from "react";
import { Trans } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import DeviceAction from "~/renderer/components/DeviceAction";
import StepProgress from "~/renderer/components/StepProgress";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { createAction } from "@ledgerhq/live-common/hw/actions/transaction";
import { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { AppRequest } from "@ledgerhq/live-common/hw/actions/app";
import { getEnv } from "@ledgerhq/live-common/env";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
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
  const tokenCurrency = account && account.type === "TokenAccount" && account.token;
  if (!transaction || !account) return null;
  return (
    <DeviceAction
      action={action}
      request={{
        tokenCurrency,
        parentAccount,
        account,
        appName: useApp,
        transaction,
        status,
        dependencies,
        requireLatestFirmware,
      }}
      Result={Result}
      onResult={({ signedOperation, transactionSignError }) => {
        if (signedOperation) {
          onTransactionSigned(signedOperation);
        } else if (transactionSignError) {
          onTransactionError(transactionSignError);
          transitionTo("confirmation");
        }
      }}
    />
  );
}
