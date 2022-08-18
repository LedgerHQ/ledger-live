// @flow

import React, { Fragment } from "react";
import { Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import invariant from "invariant";

import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";

import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";

import { ValidatorList } from "../fields";
import type { StepProps } from "../types";

const StepDelegation = ({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  error,
  validators,
}: StepProps) => {
  invariant(account && transaction, "account and transaction required");

  const { elrondResources } = account;
  invariant(elrondResources, "elrondResources required");

  const bridge: AccountBridge<Transaction> = getAccountBridge(account, parentAccount);
  const onSelectValidator = (recipient: string) =>
    onUpdateTransaction(transaction => bridge.updateTransaction(transaction, { recipient }));

  return (
    <Box flow={1}>
      <TrackPage category="Delegation Flow" name="Step Validator" />

      {error && <ErrorBanner error={error} />}

      <ValidatorList {...{ account, transaction, validators, onSelectValidator }} />
    </Box>
  );
};

const StepDelegationFooter = ({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
}: StepProps) => {
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  const canNext = !bridgePending && !hasErrors;

  return (
    <Fragment>
      <AccountFooter {...{ account, status, parentAccount }} />

      <Box horizontal={true}>
        <Button mr={1} secondary={true} onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>

        <Button
          id="delegate-continue-button"
          disabled={!canNext}
          primary={true}
          onClick={() => transitionTo("amount")}
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </Fragment>
  );
};

export { StepDelegationFooter };
export default StepDelegation;
