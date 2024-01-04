import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  StakeCreateAccountTransaction,
  Transaction,
} from "@ledgerhq/live-common/families/solana/types";
import { AccountBridge } from "@ledgerhq/types-live";
import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import LedgerByFigmentTC from "../../shared/components/LedgerByFigmentTCLink";
import ValidatorsField from "../../shared/fields/ValidatorsField";
import { StepProps } from "../types";

export default function StepValidator({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  status,
  error,
}: StepProps) {
  invariant(
    account && account.solanaResources && transaction,
    "solana account, resources and transaction required",
  );
  const updateValidator = ({ address }: { address: string }) => {
    const bridge: AccountBridge<Transaction> = getAccountBridge(account, parentAccount);
    onUpdateTransaction(_tx => {
      return bridge.updateTransaction(transaction, {
        model: {
          kind: "stake.createAccount",
          uiState: {
            delegate: {
              voteAccAddress: address,
            },
          },
        },
      });
    });
  };
  const chosenVoteAccAddr = (transaction.model.uiState as StakeCreateAccountTransaction["uiState"])
    .delegate?.voteAccAddress;
  return (
    <Box flow={1}>
      <TrackPage
        category="Delegation Flow"
        name="Step Starter"
        flow="stake"
        action="delegation"
        currency="sol"
        type="modal"
        page="Step Validator"
      />
      {error && <ErrorBanner error={error} />}
      {status ? (
        <ValidatorsField
          account={account}
          chosenVoteAccAddr={chosenVoteAccAddr}
          onChangeValidator={updateValidator}
        />
      ) : null}
    </Box>
  );
}
export function StepValidatorFooter({
  transitionTo,
  onClose,
  status,
  bridgePending,
  transaction,
}: StepProps) {
  const { errors } = status;
  const canNext = !bridgePending && !errors.voteAccAddr;
  if (!transaction) return null;
  return (
    <>
      <LedgerByFigmentTC transaction={transaction} />
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
