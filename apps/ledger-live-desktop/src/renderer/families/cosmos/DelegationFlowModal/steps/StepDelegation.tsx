import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import ValidatorField from "../fields/ValidatorField";
import { StepProps } from "../types";

export default function StepDelegation({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  status,
  error,
  t,
}: StepProps) {
  invariant(transaction && transaction.validators, "transaction required");
  const { cosmosResources } = account;
  const delegations = cosmosResources.delegations || [];
  const updateValidator = useCallback(
    ({ address }: { address: string }) => {
      const bridge: AccountBridge<Transaction> = getAccountBridge(account, parentAccount);
      onUpdateTransaction(_tx => {
        return bridge.updateTransaction(transaction, {
          validators: [
            {
              address,
              amount: BigNumber(0),
            },
          ],
        });
      });
    },
    [onUpdateTransaction, account, transaction, parentAccount],
  );
  const chosenVoteAccAddr = transaction.validators[0]?.address || "";

  return (
    <Box flow={1}>
      <TrackPage
        category="Delegation Flow"
        name="Step Starter"
        page="Step Validator"
        flow="stake"
        action="delegation"
        currency={account.currency.id}
        type="modal"
      />
      {error && <ErrorBanner error={error} />}
      <ValidatorField
        account={account}
        status={status}
        t={t}
        delegations={delegations}
        onChangeValidator={updateValidator}
        chosenVoteAccAddr={chosenVoteAccAddr}
      />
    </Box>
  );
}
export function StepDelegationFooter({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
  transaction,
}: StepProps) {
  const { errors } = status;
  const canNext =
    !bridgePending && !errors.validators && transaction && transaction.validators.length > 0;
  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          id="delegate-continue-button"
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
