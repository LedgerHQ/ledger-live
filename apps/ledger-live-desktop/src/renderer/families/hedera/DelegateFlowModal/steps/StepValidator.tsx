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
import ValidatorField from "../fields/ValidatorField";
import { StepProps } from "../types";

export default function StepValidator({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  error,
}: Readonly<StepProps>) {
  invariant(account && transaction, "account and transaction required");

  const updateValidator = (validator: HederaValidator) => {
    const bridge: AccountBridge<Transaction> = getAccountBridge(account, parentAccount);
    onUpdateTransaction(() => {
      return bridge.updateTransaction(transaction, {
        recipient: validator.address,
        properties: {
          name: "updateAccount",
          stakedNodeId: validator.nodeId,
        },
      });
    });
  };

  const selectedValidatorAddress = transaction.recipient ?? null;

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
      <ValidatorField
        account={account}
        onChangeValidator={updateValidator}
        selectedValidatorAddress={selectedValidatorAddress}
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
    typeof transaction.properties?.stakedNodeId === "number";

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
