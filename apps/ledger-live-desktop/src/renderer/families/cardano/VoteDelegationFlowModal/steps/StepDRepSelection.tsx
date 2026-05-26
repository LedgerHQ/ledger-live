import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import { StepProps } from "../types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { Transaction as CardanoTransaction } from "@ledgerhq/live-common/families/cardano/types";
import { DRep } from "@ledgerhq/live-common/families/cardano/DRep";
import DRepContainer from "../DRep";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import TranslatedError from "~/renderer/components/TranslatedError";
import Alert from "~/renderer/components/Alert";

export default function StepDRep({
  account,
  onUpdateTransaction,
  status,
  error,
  setSelectedDRep,
}: StepProps) {
  invariant(account, "account and transaction required");
  const { cardanoResources } = account;
  invariant(cardanoResources, "cardanoResources required");
  const [selectedDRepHex, setSelectedDRepHex] = React.useState<string | null>(null);
  const { errors } = status;
  const displayError = errors.amount?.message ? errors.amount : "";

  const selectDRep = (dRep: DRep) => {
    setSelectedDRepHex(dRep.hex);
    setSelectedDRep(dRep);
    onUpdateTransaction((transaction: CardanoTransaction) => {
      const bridge = getAccountBridge(account);
      return bridge.updateTransaction(transaction, {
        mode: "voteDelegate",
        dRepHex: dRep.hex,
        dRepNoConfidence: undefined,
        dRepAbstain: undefined,
      });
    });
  };

  return (
    <Box flow={1}>
      <TrackPage category="dRep Flow" name="Step dRep" />
      {error && <ErrorBanner error={error} />}
      <DRepContainer
        account={account}
        status={status}
        onChangeDRep={selectDRep}
        selectedDRepHex={selectedDRepHex || ""}
      />
      {displayError ? (
        <Alert type="error">
          <TranslatedError error={displayError} field="title" />
        </Alert>
      ) : null}
    </Box>
  );
}

export function StepDRepFooter({
  transitionTo,
  account,
  status,
  bridgePending,
  transaction,
  onClose,
}: StepProps) {
  invariant(account, "account required");
  const { errors } = status;
  const canNext = !bridgePending && Object.keys(errors).length === 0 && transaction;

  return (
    <Box horizontal justifyContent="flex-end" flow={2} grow>
      <AccountFooter account={account} status={status} />
      <Button mr={1} onClick={onClose}>
        <Trans i18nKey="common.cancel" />
      </Button>
      <Button
        id="vote-delegate-continue-button"
        disabled={!canNext}
        primary
        onClick={() => transitionTo("summary")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
}
