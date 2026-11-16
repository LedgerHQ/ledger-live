import React, { useMemo } from "react";
import { TrackScreen } from "@shared/analytics-react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import GenericStepConnectDevice from "./GenericStepConnectDevice";
import { StepProps } from "../types";
import { getConnectAppDependencies } from "./connectAppDependencies";

export default function StepConnectDevice({
  account,
  parentAccount,
  transaction,
  broadcast,
  transitionTo,
  useApp,
  dependencies,
  onTransactionError,
  onTransactionSigned,
  manifestId,
  manifestName,
  location,
}: StepProps) {
  const connectDependencies = useMemo(
    () =>
      getConnectAppDependencies(
        account ? getMainAccount(account, parentAccount).currency : undefined,
        useApp,
        dependencies,
      ),
    [account, useApp, dependencies, parentAccount],
  );

  return (
    <>
      <TrackScreen category="Sign Raw Transaction Flow" name="Step ConnectDevice" />
      <GenericStepConnectDevice
        account={account}
        useApp={useApp}
        parentAccount={parentAccount}
        transaction={transaction}
        broadcast={broadcast}
        transitionTo={transitionTo}
        onTransactionError={onTransactionError}
        onTransactionSigned={onTransactionSigned}
        dependencies={connectDependencies}
        manifestId={manifestId}
        manifestName={manifestName}
        requireLatestFirmware
        location={location}
      />
    </>
  );
}
