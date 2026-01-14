import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import Alert from "~/renderer/components/Alert";
import TranslatedError from "~/renderer/components/TranslatedError";
import { urls } from "~/config/urls";
import type { StepProps } from "../types";
import AmountField from "../../shared/staking/AmountField";

const StepAmount = ({ t, account, parentAccount, transaction, error, status }: StepProps) => {
  if (!status) return null;

  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const feeError = status.errors.fee;

  return (
    <Box flow={4}>
      <TrackPage
        category="Delegation Flow"
        name="Step Amount"
        flow="stake"
        action="staking"
        currency="hedera"
      />
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {error ? <ErrorBanner error={error} /> : null}
      {account && transaction && mainAccount && (
        <>
          <AmountField account={account} />
          <Alert
            type="primary"
            learnMoreUrl={urls.hedera.staking}
            learnMoreLabel={<Trans i18nKey="hedera.delegation.flow.steps.amount.learnMore" />}
          >
            {t("hedera.delegation.flow.steps.amount.alert")}
          </Alert>
        </>
      )}
      {feeError && (
        <Alert type="error">
          <TranslatedError error={feeError} />
        </Alert>
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

    const mainAccount = getMainAccount(account, parentAccount);
    const isTerminated = mainAccount.currency.terminated;
    const hasErrors = Object.keys(errors).length;
    const canNext = !bridgePending && !hasErrors && !isTerminated;

    return (
      <>
        <AccountFooter parentAccount={parentAccount} account={account} status={status} />
        <Button
          id="send-amount-continue-button"
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
