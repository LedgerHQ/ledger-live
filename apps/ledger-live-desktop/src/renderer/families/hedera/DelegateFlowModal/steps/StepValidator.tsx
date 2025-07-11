import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { HederaValidator, Transaction } from "@ledgerhq/live-common/families/hedera/types";
import { AccountBridge } from "@ledgerhq/types-live";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import ValidatorsListField from "../../shared/staking/ValidatorsListField";
import { StepProps } from "../types";

export default function StepValidator({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  error,
}: Readonly<StepProps>) {
  invariant(account && transaction, "hedera: account and transaction required");

  const updateValidator = (validator: HederaValidator) => {
    const bridge: AccountBridge<Transaction> = getAccountBridge(account, parentAccount);
    onUpdateTransaction(() => {
      return bridge.updateTransaction(transaction, {
        properties: {
          name: "staking",
          mode: "delegate",
          stakingNodeId: validator.nodeId,
        },
      });
    });
  };

  const selectedValidatorNodeId = transaction.properties?.stakingNodeId ?? null;

  return (
    <Box flow={1}>
      <TrackPage
        category="Delegation Flow"
        name="Step Starter"
        page="Step Validator"
        flow="stake"
        action="staking"
        currency="hedera"
        type="modal"
      />
      {error && <ErrorBanner error={error} />}
      <ValidatorsListField
        account={account}
        onChangeValidator={updateValidator}
        selectedValidatorNodeId={selectedValidatorNodeId}
      />
    </Box>
  );
}

export function StepValidatorFooter({
  transitionTo,
  account,
  onClose,
  status,
  bridgePending,
  transaction,
}: Readonly<StepProps>) {
  invariant(account, "account required");

  const { errors } = status;
  const canNext =
    !bridgePending &&
    !errors.validators &&
    transaction &&
    typeof transaction.properties?.stakingNodeId === "number";

  return (
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
  );
}
