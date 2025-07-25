import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import { StepProps } from "../types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { AccountBridge } from "@ledgerhq/types-live";
import ValidatorField from "../fields/ValidatorField";
import LedgerByFigmentTCLink from "../components/LedgerByFigmentTCLink";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import { Transaction } from "@ledgerhq/live-common/families/near/types";

export default function StepStake({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  error,
  status,
}: StepProps) {
  invariant(account && transaction, "account and transaction required");
  const updateValidator = ({ address }: { address: string }) => {
    const bridge: AccountBridge<Transaction> = getAccountBridge(account, parentAccount);
    onUpdateTransaction(() => {
      return bridge.updateTransaction(transaction, {
        recipient: address,
      });
    });
  };
  const chosenVoteAccAddr = transaction.recipient || "";
  return (
    <Box flow={1}>
      <TrackPage
        category="Delegation Flow"
        name="Step Starter"
        page="Step Validator"
        flow="stake"
        action="staking"
        currency="near"
        type="modal"
      />
      {error && <ErrorBanner error={error} />}
      {status.errors.sender && <ErrorBanner error={status.errors.sender} />}
      <ValidatorField
        account={account}
        onChangeValidator={updateValidator}
        chosenVoteAccAddr={chosenVoteAccAddr}
      />
    </Box>
  );
}
export function StepStakeFooter({
  transitionTo,
  account,
  onClose,
  status,
  bridgePending,
  transaction,
}: StepProps) {
  invariant(account, "account required");
  const { errors } = status;
  const canNext =
    !bridgePending && !errors.validators && transaction && transaction.recipient && !errors.sender;
  return (
    <>
      {transaction && <LedgerByFigmentTCLink transaction={transaction} />}
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          id="stake-continue-button"
          disabled={!canNext}
          primary
          onClick={() => transitionTo("amount")}
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
}
