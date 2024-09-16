import React, { Fragment, PureComponent } from "react";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import Alert from "~/renderer/components/Alert";
import TranslatedError from "~/renderer/components/TranslatedError";
import AccountFooter from "../AccountFooter";
import SendAmountFields from "../SendAmountFields";
import { StepProps } from "../types";
import LowGasAlertBuyMore from "~/renderer/families/evm/SendAmountFields/LowGasAlertBuyMore";
import { closeAllModal } from "~/renderer/actions/modals";
const StepAmount = ({
  account,
  parentAccount,
  transaction,
  onChangeTransaction,
  error,
  warning,
  status,
  bridgePending,
  updateTransaction,
}: StepProps) => {
  if (!status) return null;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const { gasPrice: gasPriceError } = status.errors;

  return (
    <Box flow={4}>
      <TrackPage category="Sign Transaction Flow" name="Step Amount" />
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {error || warning
        ? !gasPriceError && (
            <Alert type={error ? "error" : "warning"}>
              <TranslatedError error={error || warning} />
            </Alert>
          )
        : null}
      {account && transaction && mainAccount && (
        <Fragment key={account.id}>
          <SendAmountFields
            account={mainAccount}
            parentAccount={parentAccount}
            status={status}
            transaction={transaction}
            onChange={onChangeTransaction}
            bridgePending={bridgePending}
            updateTransaction={updateTransaction}
          />
        </Fragment>
      )}
      {mainAccount && gasPriceError && (
        <LowGasAlertBuyMore
          account={mainAccount}
          handleRequestClose={closeAllModal}
          gasPriceError={gasPriceError}
          trackingSource={"sign flow"}
        />
      )}
    </Box>
  );
};
export class StepAmountFooter extends PureComponent<StepProps> {
  onNext = async () => {
    const { transitionTo } = this.props;
    transitionTo("summary");
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
          id={"sign-transaction-amount-continue-button"}
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
