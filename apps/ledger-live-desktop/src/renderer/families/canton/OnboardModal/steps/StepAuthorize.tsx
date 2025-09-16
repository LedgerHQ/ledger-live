import BigNumber from "bignumber.js";
import React, { useEffect, useState } from "react";
import { Trans } from "react-i18next";
import { PreApprovalStatus } from "@ledgerhq/coin-canton/types";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import AccountRow from "~/renderer/components/AccountsList/AccountRow";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyBadge from "~/renderer/components/CurrencyBadge";
import Link from "~/renderer/components/Link";
import Spinner from "~/renderer/components/Spinner";
import TransactionConfirm from "~/renderer/components/TransactionConfirm";
import { ValidatorRow } from "../fields/ValidatorRow";
import { OnboardingData } from "../types";
import { createPlaceholderAccount } from "../utils/accountUtils";

export type StepAuthorizeProps = {
  accountName: string;
  clearError: () => void;
  currency: CryptoCurrency;
  selectedAccounts: Account[];
  device: Device;
  isAuthorized?: boolean;
  onboardingData?: OnboardingData;
  authorizeStatus: PreApprovalStatus;
  handlePreapproval: () => void;
};

export type StepAuthorizeFooterProps = {
  currency: CryptoCurrency;
  authorizeStatus: PreApprovalStatus;
  handlePreapproval?: () => void;
};

const StepAuthorize = ({
  accountName,
  clearError,
  currency,
  selectedAccounts,
  authorizeStatus,
  device,
  isAuthorized = true,
  onboardingData,
  handlePreapproval,
}: StepAuthorizeProps) => {
  const selectedAccount = selectedAccounts[0];

  const placeholderAccount = createPlaceholderAccount(currency, selectedAccount);
  const [currentAccountName, setCurrentAccountName] = useState(accountName);

  useEffect(() => {
    const name = onboardingData?.accountName || accountName;
    setCurrentAccountName(name);
  }, [accountName, onboardingData]);

  const _handleStartPreapproval = () => {
    clearError();
    handlePreapproval();
  };

  const renderContent = (status: PreApprovalStatus) => {
    switch (status) {
      case PreApprovalStatus.SIGN:
        return (
          <Box>
            <TransactionConfirm
              device={device}
              account={placeholderAccount!}
              parentAccount={null}
              transaction={
                {
                  family: "canton",
                  mode: "preapproval",
                  recipient: onboardingData?.partyId || "",
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
      case PreApprovalStatus.ERROR:
        return (
          <Box>
            <Alert type="error" mb={4}>
              Pre-approval failed
            </Alert>
            <Box horizontal alignItems="center" justifyContent="space-between">
              <Button
                onClick={() => {
                  clearError();
                  handlePreapproval();
                }}
              >
                <Trans i18nKey="common.retry">Retry</Trans>
              </Button>
            </Box>
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
                account={placeholderAccount!}
                accountName={currentAccountName}
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

              <ValidatorRow isSelected={isAuthorized} disabled={true} />
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
}: StepAuthorizeFooterProps) => {
  if (authorizeStatus === PreApprovalStatus.SIGN) {
    return <></>;
  }

  const handleClick = () => {
    handlePreapproval?.();
  };

  return (
    <Box horizontal alignItems="center" justifyContent="space-between" grow>
      {currency && <CurrencyBadge currency={currency} />}
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
