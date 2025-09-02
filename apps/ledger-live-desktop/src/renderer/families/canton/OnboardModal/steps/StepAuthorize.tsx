import React, { useState, useEffect } from "react";
import { Trans } from "react-i18next";
import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import {
  getDerivationScheme,
  runAccountDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import logger from "~/renderer/logger";
import Box from "~/renderer/components/Box";
import Alert from "~/renderer/components/Alert";
import Button from "~/renderer/components/Button";
import CurrencyBadge from "~/renderer/components/CurrencyBadge";
import Link from "~/renderer/components/Link";
import Text from "~/renderer/components/Text";
import Spinner from "~/renderer/components/Spinner";
import AccountRow from "~/renderer/components/AccountsList/AccountRow";
import TransactionConfirm from "~/renderer/components/TransactionConfirm";
import { ValidatorRow } from "../fields/ValidatorRow";
import { StepId } from "../types";
import BigNumber from "bignumber.js";

export type StepAuthorizeProps = {
  accountName: string;
  clearError: () => void;
  currency: any;
  error: Error | null;
  selectedAccounts: any[];
  editedNames: Record<string, string>;
  cantonBridge: CantonCurrencyBridge;
  device: any;
  isAuthorized?: boolean;
  onboardingData?: any;
  setError: (error: Error | null) => void;
  transitionTo: (step: StepId) => void;
  onAccountCreated: (account: any) => void;
  setOnboardingData?: (data: any) => void;
};

export type StepAuthorizeFooterProps = {
  currency: any;
  isProcessing: boolean;
  error: Error | null;
  onRetry: () => void;
  onConfirm: () => void;
};

const StepAuthorize = ({
  accountName,
  clearError,
  currency,
  error,
  selectedAccounts,
  editedNames,
  cantonBridge,
  device,
  isAuthorized = true,
  onboardingData,
  setError,
  transitionTo,
  onAccountCreated,
  setOnboardingData,
}: StepAuthorizeProps) => {
  const selectedAccount = selectedAccounts[0];
  const [currentAccountName, setCurrentAccountName] = useState(accountName);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [preapprovalSubscription, setPreapprovalSubscription] = useState<any>(null);

  useEffect(() => {
    const name = onboardingData?.accountName || accountName;
    setCurrentAccountName(name);
  }, [accountName, onboardingData]);

  useEffect(() => {
    return () => {
      if (preapprovalSubscription) {
        logger.log("Cleaning up preapproval subscription");
        preapprovalSubscription.unsubscribe();
      }
    };
  }, [preapprovalSubscription]);

  const handleStartPreapproval = () => {
    setShowConfirmation(true);
    clearError();
  };

  const handleRetry = () => {
    if (preapprovalSubscription) {
      preapprovalSubscription.unsubscribe();
      setPreapprovalSubscription(null);
    }

    clearError();
    setIsProcessing(false);
    setShowConfirmation(false);
    setProgress(0);
    setMessage("");
  };

  const handlePreapproval = () => {
    console.log("[StepAuthorize] Starting preapproval process");

    setIsProcessing(true);
    setProgress(0);
    setMessage("Starting transaction pre-approval...");
    clearError();

    if (!onboardingData) {
      setError(new Error("No onboarding data found in modal state"));
      setIsProcessing(false);
      return;
    }

    const { partyId, address, device: deviceId, accountIndex } = onboardingData;

    const derivationScheme = getDerivationScheme({ derivationMode: "", currency });
    const derivationPath = runAccountDerivationScheme(derivationScheme, currency, {
      account: accountIndex,
    });

    let preapprovalResult: any = null;

    const subscription = cantonBridge
      .authorizePreapproval(
        deviceId,
        derivationPath,
        partyId,
        currency.validatorAddress || "default-validator",
      )
      .subscribe({
        next: (progressData: any) => {
          logger.log("Canton preapproval progress", progressData);

          if (progressData.approved !== undefined) {
            preapprovalResult = progressData;
          }

          if (progressData.progress) {
            setProgress(progressData.progress);
          }
          if (progressData.message) {
            setMessage(`Pre-approval: ${progressData.message}`);
          }
        },
        complete: () => {
          logger.log("Canton preapproval completed", preapprovalResult);

          if (!preapprovalResult?.approved) {
            const errorMessage = `Transaction pre-approval failed: ${preapprovalResult?.message || "Unknown error"}`;
            logger.error(errorMessage);
            setError(new Error(errorMessage));
            setIsProcessing(false);
            setPreapprovalSubscription(null);
            return;
          }

          setProgress(100);
          setMessage("Pre-approval completed successfully!");

          const accountShape = selectedAccount;

          setOnboardingData?.({
            ...onboardingData,
            completedAccount: accountShape,
          });

          setPreapprovalSubscription(null);

          transitionTo(StepId.FINISH);
        },
        error: (error: Error) => {
          logger.error("Canton preapproval failed", error);
          setError(error);
          setIsProcessing(false);
          setPreapprovalSubscription(null);
        },
      });

    setPreapprovalSubscription(subscription);
  };

  if (isProcessing) {
    return (
      <Box>
        <Box mb={4} horizontal alignItems="center" justifyContent="center">
          <Box mr={3}>
            <Spinner size={20} />
          </Box>
          <Box>
            <Text ff="Inter|SemiBold" fontSize={14} color="palette.text.shade100">
              {message}
            </Text>
            <Text fontSize={12} color="palette.text.shade60">
              {progress}% complete
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert type="error" mb={4}>
          Pre-approval failed: {error.message}
        </Alert>
        <Box horizontal alignItems="center" justifyContent="space-between">
          <Button onClick={handleRetry}>
            <Trans i18nKey="common.retry">Retry</Trans>
          </Button>
        </Box>
      </Box>
    );
  }

  if (showConfirmation && device) {
    return (
      <Box>
        <TransactionConfirm
          device={device}
          account={selectedAccount}
          parentAccount={null}
          transaction={
            {
              family: "canton",
              mode: "preapproval",
              recipient: onboardingData?.partyId || "",
              amount: new BigNumber(0),
              onboardingData,
            } as any
          }
          status={
            {
              amount: new BigNumber(0),
              totalSpent: new BigNumber(0),
              estimatedFees: new BigNumber(0),
              errors: {},
              warnings: {},
            } as any
          }
        />
        <Box mt={4} horizontal alignItems="center" justifyContent="space-between">
          <Button onClick={() => setShowConfirmation(false)}>
            <Trans i18nKey="common.back">Back</Trans>
          </Button>
          <Button primary onClick={handlePreapproval}>
            <Trans i18nKey="common.confirm">Confirm</Trans>
          </Button>
        </Box>
      </Box>
    );
  }

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
          account={selectedAccount}
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

      <Box mb={4}>
        <Alert>
          <Trans i18nKey="canton.addAccount.combined.preapproval">
            Automaticaly accept incoming funds to this account. <br />
            <Link href="https://ledger.com" type="external">
              <Trans i18nKey="common.learnMore" />
            </Link>
          </Trans>
        </Alert>
      </Box>

      <Box horizontal alignItems="center" justifyContent="space-between">
        {currency && <CurrencyBadge currency={currency} />}
        <Button primary onClick={handleStartPreapproval}>
          <Trans i18nKey="canton.addAccount.authorization.startPreapproval">
            Start Pre-approval
          </Trans>
        </Button>
      </Box>
    </Box>
  );
};

export const StepAuthorizeFooter = ({
  currency,
  isProcessing,
  error,
  onRetry,
  onConfirm,
}: StepAuthorizeFooterProps) => {
  if (isProcessing) {
    return null;
  }

  if (error) {
    return (
      <Box horizontal alignItems="center" justifyContent="space-between" grow>
        {currency && <CurrencyBadge currency={currency} />}
        <Button primary onClick={onRetry}>
          <Trans i18nKey="common.retry">Retry</Trans>
        </Button>
      </Box>
    );
  }

  return null;
};

export default StepAuthorize;
