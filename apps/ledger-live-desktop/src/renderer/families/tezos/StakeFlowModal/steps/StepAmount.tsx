import React, { Fragment, PureComponent, useEffect, useState } from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { isAwaitingDelegation, useDelegation } from "@ledgerhq/live-common/families/tezos/react";
import { useSelector } from "LLD/hooks/redux";
import { accountSelector } from "~/renderer/reducers/accounts";
import TrackPage from "~/renderer/analytics/TrackPage";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Spinner from "~/renderer/components/Spinner";
import SpendableBanner from "~/renderer/components/SpendableBanner";
import Text from "~/renderer/components/Text";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import AmountField from "~/renderer/modals/Send/fields/AmountField";
import {
  AWAIT_DELEGATION_POLL_INTERVAL_MS,
  AWAIT_DELEGATION_SYNC_PRIORITY,
  MAX_AWAIT_DELEGATION_POLLS,
} from "../constants";
import { StepProps } from "../types";

const StepAmount = ({
  t,
  account,
  parentAccount,
  transaction,
  onChangeTransaction,
  error,
  status,
  bridgePending,
}: StepProps) => {
  invariant(account, "account required");
  invariant(transaction?.family === "tezos", "tezos transaction required");

  const mainAccount = getMainAccount(account, parentAccount);
  // useBridgeTransaction snapshots the account; use the live one to see post-broadcast delegation state.
  const liveAccount = useSelector(state => accountSelector(state, { accountId: mainAccount.id }));
  const accountForHooks = liveAccount ?? mainAccount;
  const delegation = useDelegation(accountForHooks);
  const awaitingDelegation = isAwaitingDelegation(delegation, transaction);
  const [awaitDelegationTimedOut, setAwaitDelegationTimedOut] = useState(false);
  const syncDispatch = useBridgeSync();

  // Body mounts <SyncSkipUnderPriority priority={100} />; the await-sync must exceed
  // that threshold or it's silently dropped.
  useEffect(() => {
    if (!awaitingDelegation) {
      setAwaitDelegationTimedOut(false);
      return;
    }
    let attempts = 0;
    const dispatchSync = () => {
      syncDispatch({
        type: "SYNC_ONE_ACCOUNT",
        priority: AWAIT_DELEGATION_SYNC_PRIORITY,
        accountId: mainAccount.id,
        reason: "tezos-stake-await-delegation",
      });
      attempts += 1;
    };
    dispatchSync();
    const id = setInterval(() => {
      if (attempts >= MAX_AWAIT_DELEGATION_POLLS) {
        clearInterval(id);
        setAwaitDelegationTimedOut(true);
        return;
      }
      dispatchSync();
    }, AWAIT_DELEGATION_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [awaitingDelegation, mainAccount.id, syncDispatch]);

  if (!status) return null;

  if (awaitingDelegation && !awaitDelegationTimedOut) {
    return (
      <Box flow={4}>
        <Box flow={4} alignItems="center" justifyContent="center" py={50}>
          <TrackPage
            category="Stake Flow"
            name="Step Amount Pending Delegation"
            flow="stake"
            action="stake"
            currency="xtz"
          />
          <Spinner size={36} />
          <Text ff="Inter|Medium" fontSize={4} color="neutral.c80" mt={4} textAlign="center">
            <Trans i18nKey="tezos.stake.flow.amount.awaitingDelegation" />
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flow={4}>
      <TrackPage
        category="Stake Flow"
        name="Step Amount"
        flow="stake"
        action="stake"
        currency="xtz"
      />
      <CurrencyDownStatusAlert currencies={[mainAccount.currency]} />
      {error ? <ErrorBanner error={error} /> : null}
      <Fragment key={account.id}>
        <SpendableBanner
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
        />
        <AmountField
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          onChangeTransaction={onChangeTransaction}
          status={status}
          bridgePending={bridgePending}
          t={t}
          withUseMaxLabel
        />
        <Alert type="primary" small>
          <Trans i18nKey="tezos.stake.flow.amount.disclaimer" />
        </Alert>
      </Fragment>
    </Box>
  );
};

export class StepAmountFooter extends PureComponent<StepProps> {
  onNext = async () => {
    this.props.transitionTo("device-staking");
  };

  render() {
    const { account, parentAccount, status, bridgePending } = this.props;
    if (!account) return null;
    const hasErrors = Object.keys(status.errors).length > 0;
    const canNext = !bridgePending && !hasErrors;
    return (
      <>
        <AccountFooter parentAccount={parentAccount} account={account} status={status} />
        <Button
          id="tezos-stake-amount-continue-button"
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

export default StepAmount;
