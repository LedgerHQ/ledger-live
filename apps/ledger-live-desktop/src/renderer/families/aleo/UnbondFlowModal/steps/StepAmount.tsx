import BigNumber from "bignumber.js";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { MIN_DELEGATOR_STAKE_MICROCREDITS } from "@ledgerhq/live-common/families/aleo/constants";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import React, { Fragment, PureComponent } from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import AmountField from "~/renderer/modals/Send/fields/AmountField";
import UnbondableBanner from "../../shared/UnbondableBanner";
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
      {!status.errors.amount && status.errors.fees ? (
        <ErrorBanner error={status.errors.fees} />
      ) : null}
      {account && transaction && mainAccount && (
        <Fragment key={account.id}>
          {unit ? (
            <>
              <Alert type="hint" small data-testid="unbond-info-banner">
                <Trans
                  i18nKey="aleo.unbond.flow.steps.amount.belowMinimum"
                  values={{
                    minAmount: formatCurrencyUnit(
                      unit,
                      new BigNumber(MIN_DELEGATOR_STAKE_MICROCREDITS),
                      { showCode: true },
                    ),
                  }}
                />
              </Alert>
              <UnbondableBanner unit={unit} bondedBalance={bondedBalance} />
            </>
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
