import React, { useState, useEffect } from "react";
import { Trans } from "react-i18next";
import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import {
  getDerivationScheme,
  getDerivationModesForCurrency,
  runAccountDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import Box from "~/renderer/components/Box";
import Alert from "~/renderer/components/Alert";
import Button from "~/renderer/components/Button";
import CurrencyBadge from "~/renderer/components/CurrencyBadge";
import Link from "~/renderer/components/Link";
import { PreApprovalStatus } from "@ledgerhq/coin-canton/types";
import Spinner from "~/renderer/components/Spinner";
import AccountRow from "~/renderer/components/AccountsList/AccountRow";
import TransactionConfirm from "~/renderer/components/TransactionConfirm";
import { ValidatorRow } from "../fields/ValidatorRow";
import { StepId, OnboardingData } from "../types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import BigNumber from "bignumber.js";

export type StepAuthorizeProps = {
  accountName: string;
  clearError: () => void;
  currency: CryptoCurrency;
  error: Error | null;
  selectedAccounts: Account[];
  editedNames: Record<string, string>;
  cantonBridge: CantonCurrencyBridge;
  device: Device;
  isAuthorized?: boolean;
  onboardingData?: OnboardingData;
  setError: (error: Error | null) => void;
  transitionTo: (step: StepId) => void;
  onAddAccounts: (account: Account[]) => void;
  setOnboardingData?: (data: OnboardingData) => void;
  authorizeStatus: PreApprovalStatus;
  isProcessing: boolean;
  showConfirmation: boolean;
  progress: number;
  message: string;
  handlePreapproval: () => void;
};

export type StepAuthorizeFooterProps = {
  currency: CryptoCurrency;
  isProcessing: boolean;
  authorizeStatus: PreApprovalStatus;
  error: Error | null;
  onRetry: () => void;
  onConfirm: () => void;
  handlePreapproval?: () => void;
};

const StepAuthorize = ({
  accountName,
  clearError,
  currency,
  error: _error,
  selectedAccounts,
  editedNames: _editedNames,
  cantonBridge: _cantonBridge,
  authorizeStatus,
  device,
  isAuthorized = true,
  onboardingData,
  setError: _setError,
  transitionTo: _transitionTo,
  onAddAccounts: _onAddAccounts,
  setOnboardingData: _setOnboardingData,
  isProcessing: _isProcessing,
  showConfirmation: _showConfirmation,
  progress: _progress,
  message: _message,
  handlePreapproval,
}: StepAuthorizeProps) => {
  const selectedAccount = selectedAccounts[0];

  // Create placeholder account like in StepOnboard
  const placeholderAccount =
    selectedAccount ||
    (() => {
      if (!currency || !currency.id) {
        return null;
      }

      const derivationMode = getDerivationModesForCurrency(currency)[0];
      const derivationScheme = getDerivationScheme({ derivationMode, currency });
      const freshAddressPath = runAccountDerivationScheme(derivationScheme, currency, {
        account: 0,
      });

      return {
        type: "Account" as const,
        id: `canton-placeholder-${currency.id}`,
        currency,
        freshAddress: "canton-placeholder-address",
        freshAddressPath,
        balance: new BigNumber(0),
        spendableBalance: new BigNumber(0),
        derivationMode,
        index: 0,
        seedIdentifier: "canton-placeholder",
        used: false,
        blockHeight: 0,
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
        lastSyncDate: new Date(),
        creationDate: new Date(),
      };
    })();
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
              account={placeholderAccount}
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
                account={placeholderAccount}
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
  isProcessing: _isProcessing,
  error: _error,
  authorizeStatus,
  onRetry: _onRetry,
  onConfirm: _onConfirm,
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
