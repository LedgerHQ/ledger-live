import React, { useMemo } from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import GenericStepConnectDevice from "./GenericStepConnectDevice";
import { StepProps } from "../types";
import { dependenciesToAppRequests } from "@ledgerhq/live-common/hw/actions/app";

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
  const connectDependencies = useMemo(() => {
    const appRequests = dependenciesToAppRequests(dependencies);

    if (account) {
      // Nb setting the mainAccount as a dependency will ensure latest versions of plugins.
      return [{ currency: getMainAccount(account, parentAccount).currency }, ...appRequests];
    }
    return appRequests;
  }, [account, dependencies, parentAccount]);

  return (
    <>
      <TrackPage category="Sign Raw Transaction Flow" name="Step ConnectDevice" />
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
