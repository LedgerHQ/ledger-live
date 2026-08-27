import BigNumber from "bignumber.js";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import React, { Fragment, PureComponent } from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Label from "~/renderer/components/Label";
import SpendableBanner from "~/renderer/components/SpendableBanner";
import Text from "~/renderer/components/Text";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import AmountField from "~/renderer/modals/Send/fields/AmountField";
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
  // Max button and bonded ceiling are wired through the bridge: useAllAmount resolves to the
  // account's bonded balance for unbond_public transactions (see calculateAmount in coin-aleo),
  // and getTransactionStatus rejects amounts above it with NotEnoughBalance.
  const unit = useMaybeAccountUnit(account);
  const bondedBalance = (account as AleoAccount)?.aleoResources?.bondedBalance ?? new BigNumber(0);

  if (!status) return null;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  return (
    <Box flow={4}>
      <TrackPage
        category="Delegation Flow"
        name="Step Amount"
        flow="unbond"
        action="unbonding"
        currency="aleo"
      />
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {error ? <ErrorBanner error={error} /> : null}
      {account && transaction && mainAccount && (
        <Fragment key={account.id}>
          {unit ? (
            <Box horizontal justifyContent="space-between" alignItems="center" mb={2}>
              <Label>
                <Trans i18nKey="aleo.unbond.flow.steps.amount.availableLabel" />
              </Label>
              <Text
                color="neutral.c80"
                ff="Inter|Medium"
                fontSize={13}
                data-testid="unbond-available"
              >
                {formatCurrencyUnit(unit, bondedBalance, {
                  showCode: true,
                  disableRounding: true,
                })}
              </Text>
            </Box>
          ) : null}
          {account && transaction ? (
            <SpendableBanner
              account={account}
              parentAccount={parentAccount}
              transaction={transaction}
            />
          ) : null}
          <AmountField
            status={status}
            account={account}
            parentAccount={parentAccount}
            transaction={transaction}
            onChangeTransaction={onChangeTransaction}
            bridgePending={bridgePending}
            t={t}
            withUseMaxLabel
          />
        </Fragment>
      )}
    </Box>
  );
};

export class StepAmountFooter extends PureComponent<StepProps> {
  onNext = async () => {
    const { transitionTo } = this.props;
    transitionTo("connectDevice");
  };

  render() {
    const { account, parentAccount, status, bridgePending } = this.props;
    const { errors } = status;
    if (!account) return null;
    const hasErrors = Object.keys(errors).length;
    const canNext = !bridgePending && !hasErrors;
    return (
      <>
        <AccountFooter parentAccount={parentAccount} account={account} status={status} />
        <Button
          id={"unbond-amount-continue-button"}
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
