// @flow
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { Transaction } from "@ledgerhq/live-common/families/helium/types";
import type { AccountBridge } from "@ledgerhq/live-common/types/index";
import invariant from "invariant";
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import HIPField from "../../shared/fields/HIPField";
import VoteRadioGroup from "../../shared/components/VoteRadioGroup";
import type { StepProps } from "../types";
import { useVotes } from "@ledgerhq/live-common/families/helium/react";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import { getMainAccount } from "@ledgerhq/live-common/account/index";

export default function StepVote({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  status,
  error,
  t,
}: StepProps) {
  invariant(
    account && account.heliumResources && transaction,
    "helium account, resources and transaction required",
  );
  const bridge: AccountBridge<Transaction> = getAccountBridge(account, parentAccount);
  let votes = useVotes();

  votes = votes.filter(vote => vote.blocksRemaining > 0);

  console.log("transaction", transaction);

  const updateVote = (vote: any) => {
    onUpdateTransaction(tx => {
      return bridge.updateTransaction(transaction, {
        model: {
          mode: "burn",
          hipID: vote.id,
          payee: "",
        },
      });
    });
  };

  const updateOption = (outcomeAddress: string, outcomeIndex: string) => {
    onUpdateTransaction(tx => {
      return bridge.updateTransaction(transaction, {
        model: {
          ...transaction.model,
          mode: "burn",
          payee: outcomeAddress,
          memo: outcomeIndex,
        },
      });
    });
  };

  return (
    <Box flow={1}>
      <TrackPage category="Helium Vote" name="Step Vote" />
      {error && <ErrorBanner error={error} />}
      {status ? (
        <HIPField
          account={account}
          transaction={transaction}
          status={status}
          t={t}
          onChangeVote={updateVote}
          votes={votes}
        />
      ) : null}
      {votes.length > 0 ? (
        <Box flow={1} justifyContent="center" horizontal alignItems="center" mt={20}>
          <VoteRadioGroup transaction={transaction} onChange={updateOption}></VoteRadioGroup>
        </Box>
      ) : null}
    </Box>
  );
}

export class StepVoteFooter extends PureComponent<StepProps> {
  onNext = async () => {
    console.log("Transaction => ");
    console.log(this.props.transaction);
    const { transitionTo } = this.props;
    transitionTo("connectDevice");
  };

  render() {
    const { account, parentAccount, status, bridgePending } = this.props;
    const { errors } = status;
    if (!account) return null;

    const mainAccount = getMainAccount(account, parentAccount);
    const isTerminated = mainAccount.currency.terminated;
    const hasErrors = Object.keys(errors).length;
    const canNext = !bridgePending && !hasErrors && !isTerminated;

    return (
      <>
        <AccountFooter parentAccount={parentAccount} account={account} status={status} />
        <Button
          id={"send-amount-continue-button"}
          isLoading={bridgePending}
          primary
          disabled={!canNext}
          onClick={this.onNext}
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </>
    );
  }
}
