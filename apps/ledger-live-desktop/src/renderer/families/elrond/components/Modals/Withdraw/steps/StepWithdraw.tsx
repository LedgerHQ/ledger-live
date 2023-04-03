import invariant from "invariant";
import React, { Fragment, useCallback } from "react";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import DelegationSelectorField from "../fields/DelegationSelectorField";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { ElrondProvider } from "@ledgerhq/live-common/families/elrond/types";
import { StepProps } from "../types";
const StepWithdraw = (props: StepProps) => {
  const {
    account,
    parentAccount,
    onUpdateTransaction,
    transaction,
    warning,
    error,
    t,
    unbondings,
    contract,
    amount,
    name,
  } = props;
  const bridge: AccountBridge<Transaction> = getAccountBridge(account, parentAccount);
  const onDelegationChange = useCallback(
    (validator: ElrondProvider) => {
      onUpdateTransaction(
        (transaction: Transaction): AccountBridge<Transaction> =>
          bridge.updateTransaction(transaction, {
            ...transaction,
            recipient: validator.contract,
            amount: BigNumber(validator.amount),
          }),
      );
    },
    [bridge, onUpdateTransaction],
  );
  return (
    <Box flow={1}>
      <TrackPage category="ClaimRewards Flow" name="Step 1" />
      {warning && !error ? <ErrorBanner error={warning} warning={true} /> : null}
      {error ? <ErrorBanner error={error} /> : null}

      {transaction.amount.gt(0) && (
        <Text fontSize={4} ff="Inter|Medium" textAlign="center">
          <Trans
            i18nKey="elrond.withdraw.flow.steps.withdraw.description"
            values={{
              validator: name,
              amount: `${denominate({
                input: String(transaction.amount),
                decimals: 4,
              })} ${getAccountUnit(account).code}`,
            }}
          >
            <b></b>
          </Trans>
        </Text>
      )}

      <DelegationSelectorField
        contract={contract}
        unbondings={unbondings}
        t={t}
        amount={amount}
        bridge={bridge}
        transaction={transaction}
        onUpdateTransaction={onUpdateTransaction}
        onChange={onDelegationChange}
      />
    </Box>
  );
};
const StepWithdrawFooter = (props: StepProps) => {
  const { transitionTo, account, parentAccount, onClose, status, bridgePending } = props;
  invariant(account, "account required");
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  const canNext = !bridgePending && !hasErrors;
  return (
    <Fragment>
      <AccountFooter status={status} account={account} parentAccount={parentAccount} />

      <Box horizontal={true}>
        <Button mr={1} secondary={true} onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>

        <Button disabled={!canNext} primary={true} onClick={() => transitionTo("connectDevice")}>
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </Fragment>
  );
};
export { StepWithdrawFooter };
export default StepWithdraw;
