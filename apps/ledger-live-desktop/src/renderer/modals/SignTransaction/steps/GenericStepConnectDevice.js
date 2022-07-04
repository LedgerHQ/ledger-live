// @flow

import { getEnv } from "@ledgerhq/live-common/lib/env";
import type { AppRequest } from "@ledgerhq/live-common/lib/hw/actions/app";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/transaction";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import type {
  Account,
  AccountLike,
  SignedOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/lib/types";
import React from "react";
import { Trans } from "react-i18next";
import { command } from "~/renderer/commands";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import DeviceAction from "~/renderer/components/DeviceAction";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import StepProgress from "~/renderer/components/StepProgress";

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
  useApp,
  status,
  transitionTo,
  onTransactionSigned,
  onTransactionError,
  dependencies,
  requireLatestFirmware,
}: {
  transitionTo: string => void,
  account: ?AccountLike,
  parentAccount: ?Account,
  transaction: ?Transaction,
  useApp?: string,
  status: TransactionStatus,
  onTransactionError: Error => void,
  onTransactionSigned: SignedOperation => void,
  dependencies?: AppRequest[],
  requireLatestFirmware?: boolean,
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

export const StepConnectDeviceFooter = ({
  t,
  transitionTo,
  onTransactionSigned,
  onTransactionError,
  device,
  eventType,
  currencyName,
  onClose,
}: any) => {
  return (
    <Box horizontal flow={2}>
      <Button onClick={() => onTransactionSigned()}>Mock tx sign success</Button>
      <Button
        onClick={() => {
          onTransactionError(new Error("Mocked tx sign error"));
          onClose();
        }}
      >
        Mock tx sign error
      </Button>
    </Box>
  );
};
