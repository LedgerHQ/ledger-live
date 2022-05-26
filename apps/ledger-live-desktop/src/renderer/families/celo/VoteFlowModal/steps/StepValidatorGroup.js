// @flow
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import type { Transaction } from "@ledgerhq/live-common/lib/families/celo/types";
import type { AccountBridge } from "@ledgerhq/live-common/lib/types";
import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import LedgerByFigmentTC from "../components/LedgerByFigmentTCLink";
import ValidatorGroupsField from "../fields/ValidatorGroupsField";
import type { StepProps } from "../types";
import { isDefaultValidatorGroupAddress } from "@ledgerhq/live-common/lib/families/celo/logic";

export default function StepValidatorGroup({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  status,
  error,
  t,
}: StepProps) {
  invariant(
    account && account.celoResources && transaction,
    "celo account, resources and transaction required",
  );

  const updateValidatorGroup = ({ address }: { address: string }) => {
    const bridge: AccountBridge<Transaction> = getAccountBridge(account, parentAccount);
    onUpdateTransaction(tx => {
      return bridge.updateTransaction(transaction, {
        recipient: address,
      });
    });
  };

  const chosenValidatorGroupAddress = transaction.recipient;

  return (
    <Box flow={1}>
      <TrackPage category="Celo Voting" name="Step ValidatorGroup" />
      {error && <ErrorBanner error={error} />}
      <ValidatorGroupsField
        account={account}
        chosenValidatorGroupAddress={chosenValidatorGroupAddress}
        onChangeValidatorGroup={updateValidatorGroup}
        status={status}
        t={t}
      />
    </Box>
  );
}

export function StepValidatorGroupFooter({
  transitionTo,
  account,
  onClose,
  bridgePending,
  transaction,
}: StepProps) {
  invariant(account, "account required");

  const canNext = !bridgePending && transaction.recipient;
  const displayTC = isDefaultValidatorGroupAddress(transaction.recipient);

  return (
    <>
      {displayTC && <LedgerByFigmentTC />}
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          id="vote-continue-button"
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
