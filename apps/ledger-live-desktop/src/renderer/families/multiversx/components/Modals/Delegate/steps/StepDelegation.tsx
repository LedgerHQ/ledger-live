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
import { Transaction } from "@ledgerhq/live-common/families/multiversx/types";
import { StepProps } from "../types";

const StepDelegation = (props: StepProps) => {
  const { account, onUpdateTransaction, transaction, error, validators } = props;
  invariant(account && transaction, "account and transaction required");
  const { multiversxResources } = account;
  invariant(multiversxResources, "multiversxResources required");
  const bridge = getAccountBridge(account);
  const onSelectValidator = (recipient: string) =>
    onUpdateTransaction(
      (transaction: Transaction): Transaction =>
        bridge.updateTransaction(transaction, {
          recipient,
        }),
    );
  return (
    <Box flow={1}>
      <TrackPage
        category="Delegation Flow"
        name="Step Validator"
        flow="stake"
        action="delegate"
        currency="MultiversX"
      />

      {error && <ErrorBanner error={error} />}

      <ValidatorList
        account={account}
        transaction={transaction}
        validators={validators}
        onSelectValidator={onSelectValidator}
      />
    </Box>
  );
};
const StepDelegationFooter = (props: StepProps) => {
  const { transitionTo, account, onClose, status, bridgePending } = props;
  const { recipient: recipientError, fees: feesError } = status.errors;
  const hasErrors = recipientError || feesError;
  const canNext = !bridgePending && !hasErrors;
  if (!account) return null;
  return (
    <Fragment>
      <AccountFooter account={account} status={status} />

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
