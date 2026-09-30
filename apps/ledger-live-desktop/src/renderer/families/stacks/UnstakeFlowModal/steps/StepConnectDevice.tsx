import React from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Spinner from "~/renderer/components/Spinner";
import Text from "~/renderer/components/Text";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import { StepProps } from "../types";

const StepConnectDevice = ({
  account,
  transaction,
  status,
  bridgePending,
  error,
  onRetry,
  transitionTo,
  onOperationBroadcasted,
  onTransactionError,
  setSigned,
}: StepProps) => {
  // A failed fee preparation leaves `fee` unset with bridgePending false -- without this branch the
  // spinner below would hide the error while useBridgeTransaction silently backs off. Gated on
  // !bridgePending so a retry's re-prepare shows the spinner, not the stale error it's replacing.
  //
  // A preparation that settles without a fee and without throwing (the classic bridge's undelegate
  // case) surfaces the status' own errors instead, so it never spins silently.
  const hasFee = !!(transaction?.fee || transaction?.fees);
  const preparationError =
    error ??
    (!bridgePending && !hasFee
      ? (status.errors.gas ?? Object.values(status.errors)[0])
      : undefined);
  if (preparationError && !bridgePending) {
    return (
      <Box flow={4} alignItems="center" justifyContent="center" py={50}>
        <TrackPage
          category="Unstake Flow"
          name="Step ConnectDevice Preparing Error"
          flow="stake"
          action="undelegate"
          currency="stx"
        />
        <ErrorDisplay error={preparationError} onRetry={onRetry} withExportLogs />
      </Box>
    );
  }

  // Mirrors the Stake flow's own gate (StakeFlowModal/steps/StepConnectDevice.tsx): coin-stacks's
  // signOperation.ts throws FeeNotLoaded when `fee` isn't set yet, and this step can mount before
  // the async fee estimate (bridgePending) resolves -- an already-connected device would otherwise
  // start signing immediately instead of waiting for preparation.
  if (bridgePending || !hasFee) {
    return (
      <Box flow={4} alignItems="center" justifyContent="center" py={50}>
        <TrackPage
          category="Unstake Flow"
          name="Step ConnectDevice Preparing"
          flow="stake"
          action="undelegate"
          currency="stx"
        />
        <Spinner size={36} />
        <Text ff="Inter|Medium" fontSize={4} color="neutral.c80" mt={4} textAlign="center">
          <Trans i18nKey="stacks.unstake.flow.preparingTransaction" />
        </Text>
      </Box>
    );
  }

  return (
    <>
      <TrackPage
        category="Unstake Flow"
        name="Step ConnectDevice"
        flow="stake"
        action="undelegate"
        currency="stx"
      />
      <GenericStepConnectDevice
        modalName="MODAL_STACKS_UNSTAKE"
        account={account}
        transaction={transaction}
        status={status}
        transitionTo={transitionTo}
        onOperationBroadcasted={onOperationBroadcasted}
        onTransactionError={onTransactionError}
        setSigned={setSigned}
      />
    </>
  );
};

export default StepConnectDevice;
