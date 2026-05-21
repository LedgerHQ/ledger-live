import React, { Fragment, PureComponent, useCallback, useEffect, useState } from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useDelegation, useTezosStakingInfo } from "@ledgerhq/live-common/families/tezos/react";
import { Transaction } from "@ledgerhq/live-common/families/tezos/types";
import { useSelector } from "LLD/hooks/redux";
import { accountSelector } from "~/renderer/reducers/accounts";
import TrackPage from "~/renderer/analytics/TrackPage";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Label from "~/renderer/components/Label";
import RequestAmount from "~/renderer/components/RequestAmount";
import Spinner from "~/renderer/components/Spinner";
import SpendableBanner from "~/renderer/components/SpendableBanner";
import Text from "~/renderer/components/Text";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import {
  AWAIT_DELEGATION_POLL_INTERVAL_MS,
  AWAIT_DELEGATION_SYNC_PRIORITY,
  MAX_AWAIT_DELEGATION_POLLS,
  STAKE_GAS_RESERVE_XTZ,
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
  const bridge = useAccountBridge<Transaction>(account, parentAccount);
  const { availableBalance } = useTezosStakingInfo(accountForHooks);
  const delegation = useDelegation(accountForHooks);
  // validateIntent throws MustDelegateBeforeStaking until the chain confirms the delegation.
  const isAwaitingDelegation =
    transaction.mode === "stake" && (!delegation || delegation.isPending);
  const [awaitDelegationTimedOut, setAwaitDelegationTimedOut] = useState(false);
  const syncDispatch = useBridgeSync();

  // Body mounts <SyncSkipUnderPriority priority={100} />; the await-sync must exceed
  // that threshold or it's silently dropped.
  useEffect(() => {
    if (!isAwaitingDelegation) {
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
  }, [isAwaitingDelegation, mainAccount.id, syncDispatch]);

  const reserveMutez = STAKE_GAS_RESERVE_XTZ.shiftedBy(mainAccount.currency.units[0].magnitude);

  const onChange = useCallback(
    (amount: BigNumber) => {
      onChangeTransaction(bridge.updateTransaction(transaction, { amount }));
    },
    [bridge, onChangeTransaction, transaction],
  );

  const onMax = useCallback(() => {
    const max = BigNumber.max(availableBalance.minus(reserveMutez), 0);
    onChangeTransaction(bridge.updateTransaction(transaction, { amount: max }));
  }, [availableBalance, bridge, onChangeTransaction, reserveMutez, transaction]);

  if (!status) return null;
  const { amount, errors, warnings } = status;
  const amountError = amount.eq(0) && bridgePending ? undefined : errors.amount;
  const amountWarning = amount.eq(0) && bridgePending ? undefined : warnings.amount;

  if (isAwaitingDelegation && !awaitDelegationTimedOut) {
    return (
      <Box flow={4}>
        {error ? <ErrorBanner error={error} /> : null}
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
        <Box flow={1}>
          <Box
            horizontal
            alignItems="center"
            justifyContent="space-between"
            style={{ width: "50%", paddingRight: 28 }}
          >
            <Label>{t("send.steps.details.amount")}</Label>
            <Text
              color="primary.c80"
              ff="Inter|Medium"
              fontSize={10}
              onClick={onMax}
              style={{ cursor: "pointer" }}
              data-testid="tezos-stake-amount-max-button"
            >
              <Trans i18nKey="send.steps.details.useMax" />
            </Text>
          </Box>
          <RequestAmount
            account={account}
            value={transaction.amount}
            validTransactionError={amountError}
            validTransactionWarning={amountWarning}
            onChange={onChange}
            autoFocus
          />
        </Box>
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
    const { account, parentAccount, status, bridgePending, transaction } = this.props;
    if (!account || !transaction) return null;
    const mainAccount = getMainAccount(account, parentAccount);
    const isTerminated = mainAccount.currency.terminated;
    const hasErrors = Object.keys(status.errors).length > 0;
    const isZero = !transaction.amount || transaction.amount.eq(0);
    const canNext = !bridgePending && !hasErrors && !isTerminated && !isZero;
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
