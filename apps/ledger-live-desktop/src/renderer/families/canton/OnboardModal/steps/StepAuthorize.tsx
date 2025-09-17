import BigNumber from "bignumber.js";
import React from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import { PreApprovalStatus } from "@ledgerhq/coin-canton/types";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import AccountRow from "~/renderer/components/AccountsList/AccountRow";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyBadge from "~/renderer/components/CurrencyBadge";
import Link from "~/renderer/components/Link";
import Spinner from "~/renderer/components/Spinner";
import TransactionConfirm from "~/renderer/components/TransactionConfirm";
import { ValidatorRow } from "../fields/ValidatorRow";
import { StepProps } from "../types";

const StepAuthorize = ({ accountName, authorizeStatus, device, onboardingData }: StepProps) => {
  invariant(onboardingData?.completedAccount, "canton: completed account is required");

  const renderContent = (status: PreApprovalStatus) => {
    switch (status) {
      case PreApprovalStatus.SIGN:
        return (
          <Box>
            <TransactionConfirm
              device={device!}
              account={onboardingData.completedAccount}
              parentAccount={null}
              transaction={
                {
                  family: "canton",
                  mode: "preapproval",
                  recipient: "",
                  amount: new BigNumber(0),
                  fee: new BigNumber(0),
                  onboardingData,
                } as Transaction
              }
              status={
                {
                  amount: new BigNumber(0),
                  totalSpent: new BigNumber(0),
                  estimatedFees: new BigNumber(0),
                  errors: {},
                  warnings: {},
                } as TransactionStatus
              }
            />
          </Box>
        );
      default:
        return (
          <Box>
            <Box mb={4}>
              <Box
                horizontal
                ff="Inter|Bold"
                color="palette.text.shade100"
                fontSize={2}
                textTransform="uppercase"
                mb={3}
              >
                <Trans i18nKey="operationDetails.account" />
              </Box>
              <AccountRow
                account={onboardingData.completedAccount}
                accountName={onboardingData.accountName || accountName}
                isDisabled={true}
                hideAmount={true}
                isReadonly={true}
              />
            </Box>

            <Box mb={4}>
              <Box
                horizontal
                ff="Inter|Bold"
                color="palette.text.shade100"
                fontSize={2}
                textTransform="uppercase"
                mb={3}
              >
                <Trans i18nKey="canton.addAccount.authorization.validatorLabel">Authorize</Trans>
              </Box>

              <ValidatorRow isSelected={true} disabled={true} />
            </Box>

            <Alert>
              <Trans i18nKey="canton.addAccount.combined.preapproval">
                Automaticaly accept incoming funds to this account. <br />
                <Link href="https://ledger.com" type="external">
                  <Trans i18nKey="common.learnMore" />
                </Link>
              </Trans>
            </Alert>
          </Box>
        );
    }
  };

  return renderContent(authorizeStatus);
};

export const StepAuthorizeFooter = ({
  currency,
  authorizeStatus,
  handlePreapproval,
}: StepProps) => {
  if (authorizeStatus === PreApprovalStatus.SIGN) {
    return <></>;
  }

  const handleClick = () => {
    handlePreapproval?.();
  };

  return (
    <Box horizontal alignItems="center" justifyContent="space-between" grow>
      <CurrencyBadge currency={currency} />
      <Button primary onClick={handleClick} disabled={authorizeStatus === PreApprovalStatus.SUBMIT}>
        {authorizeStatus === PreApprovalStatus.SUBMIT && (
          <Box mr={2}>
            <Spinner size={20} />
          </Box>
        )}
        <Trans i18nKey="canton.addAccount.authorization.startPreapproval">Confirm</Trans>
      </Button>
    </Box>
  );
};

export default StepAuthorize;
