import React, { useCallback, useEffect, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import BigNumber from "bignumber.js";
import {
  getDerivationScheme,
  runAccountDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { createEmptyHistoryCache } from "@ledgerhq/coin-framework/account/balanceHistoryCache";
import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import AccountRow from "~/renderer/components/AccountsList/AccountRow";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyBadge from "~/renderer/components/CurrencyBadge";
import logger from "~/renderer/logger";
import Spinner from "~/renderer/components/Spinner";
import Text from "~/renderer/components/Text";
import TransactionConfirm from "~/renderer/components/TransactionConfirm";
import { CantonOnboardProgress, CantonOnboardResult } from "@ledgerhq/coin-canton/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { StepProps, StepId, OnboardingData } from "../types";

interface SigningData {
  partyId: string;
  publicKey: string;
  transactionData: unknown;
  combinedHash: string;
  derivationPath?: string;
}

interface OnboardingResult {
  partyId: string;
  address?: string;
  publicKey?: string;
  transactionHash?: string;
}

const getStatusMessage = (status: OnboardStatus): string => {
  switch (status) {
    case OnboardStatus.INIT:
      return "Initializing Canton onboarding...";
    case OnboardStatus.PREPARE:
      return "Preparing onboarding transaction...";
    case OnboardStatus.SIGN:
      return "Please confirm the transaction on your device";
    case OnboardStatus.SUBMIT:
      return "Submitting onboarding transaction...";
    case OnboardStatus.SUCCESS:
      return "Onboarding completed successfully";
    case OnboardStatus.ERROR:
      return "Onboarding failed";
    default:
      return "Processing...";
  }
};

interface FooterProps {
  currency: CryptoCurrency;
  transitionTo: (stepId: StepId) => void;
  onboardingCompleted: boolean;
  isLoading?: boolean;
  status?: OnboardStatus;
}

export default function StepOnboard({
  device,
  currency,
  selectedAccounts,
  accountName,
  cantonBridge,
  transitionTo: _transitionTo,
  onAccountCreated: _onAccountCreated,
  setOnboardingData,
  setOnboardingCompleted,
  setOnboardingStatus,
  error,
  setError,
  clearError,
}: StepProps) {
  const selectedAccount = selectedAccounts[0];

  // Create a placeholder account for display purposes during onboarding
  const placeholderAccount =
    selectedAccount ||
    (() => {
      const derivationScheme = getDerivationScheme({ derivationMode: "", currency });
      const freshAddressPath = runAccountDerivationScheme(derivationScheme, currency, {
        account: 0,
      });

      const accountId = encodeAccountId({
        type: "js",
        version: "2",
        currencyId: currency.id,
        xpubOrAddress: "canton-placeholder-address",
        derivationMode: "",
      });

      return {
        type: "Account" as const,
        id: accountId,
        seedIdentifier: "canton-onboard",
        derivationMode: "",
        index: 0,
        freshAddress: "canton-placeholder-address",
        freshAddressPath,
        used: false,
        balance: new BigNumber(0),
        spendableBalance: new BigNumber(0),
        blockHeight: 0,
        currency,
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
        lastSyncDate: new Date(),
        creationDate: new Date(),
        balanceHistoryCache: createEmptyHistoryCache(),
        swapHistory: [],
      };
    })();

  const [status, setStatus] = useState<OnboardStatus>(OnboardStatus.INIT);
  const [statusMessage, setStatusMessage] = useState("");
  const [signingData, setSigningData] = useState<SigningData | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const resetState = useCallback(() => {
    setStatus(OnboardStatus.PREPARE);
    setStatusMessage("Starting Canton onboarding...");
    setSigningData(null);
  }, []);

  const handleStateUpdate = useCallback(
    (newStatus: OnboardStatus, message?: string, newSigningData?: SigningData) => {
      setStatus(newStatus);
      if (message) {
        setStatusMessage(message);
      }
      if (newSigningData) {
        setSigningData(newSigningData);
      }
    },
    [],
  );

  const handleFinish = useCallback(() => {
    setStatus(OnboardStatus.SUCCESS);
  }, []);

  const handleError = useCallback(
    (error: Error) => {
      setError(error);
      setStatus(OnboardStatus.ERROR);
    },
    [setError],
  );

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    setOnboardingData?.(null as unknown as OnboardingData);
    setOnboardingCompleted?.(false);

    if (!device || !currency) {
      new Error("Device or currency missing");
      return;
    }

    let subscription: { unsubscribe: () => void } | null = null;

    if (!cantonBridge.onboardAccount) {
      throw new Error("Canton bridge does not support onboardAccount");
    }

    const accountIndex = 0;

    const derivationScheme = getDerivationScheme({ derivationMode: "", currency });
    const derivationPath = runAccountDerivationScheme(derivationScheme, currency, {
      account: accountIndex,
    });

    let onboardingResult: OnboardingResult | null = null;

    subscription = cantonBridge.onboardAccount(device.deviceId, derivationPath).subscribe({
      next: (progressData: CantonOnboardProgress | CantonOnboardResult) => {
        logger.log("Canton onboarding progress", progressData);

        // Handle progress updates (CantonOnboardProgress has status)
        if ("status" in progressData) {
          const statusMessage = getStatusMessage(progressData.status);
          handleStateUpdate(progressData.status, statusMessage);
          setOnboardingStatus?.(progressData.status);

          if (progressData.status === OnboardStatus.SIGN) {
            logger.log("Entering signing phase, storing transaction data");
            const signingData: SigningData = {
              partyId:
                ((progressData as Record<string, unknown>).partyId as string) || "pending-party-id",
              publicKey:
                ((progressData as Record<string, unknown>).publicKey as string) ||
                "pending-public-key",
              transactionData:
                (progressData as Record<string, unknown>).transactionData || progressData,
              combinedHash:
                ((progressData as Record<string, unknown>).combinedHash as string) ||
                ((progressData as Record<string, unknown>).combined_hash as string) ||
                "",
              derivationPath: (progressData as Record<string, unknown>).derivationPath as string,
            };
            handleStateUpdate(progressData.status, statusMessage, signingData);
          }
        }

        // Handle final result (CantonOnboardResult has partyId)
        if ("partyId" in progressData && !("status" in progressData)) {
          onboardingResult = {
            partyId: progressData.partyId,
            // The bridge implementation doesn't provide these fields, so we'll use placeholders
            publicKey: "generated-public-key",
            address: progressData.partyId,
          };
        }
      },
      complete: () => {
        logger.log("Canton onboarding completed successfully", onboardingResult);

        if (onboardingResult?.partyId) {
          const onboardingDataObject = {
            partyId: onboardingResult.partyId,
            address: onboardingResult.address || "",
            publicKey: onboardingResult.publicKey || "",
            device: device.deviceId,
            accountIndex,
            currency: currency.id,
            accountName: accountName,
            transactionHash: onboardingResult.transactionHash || "",
            completedAccount: placeholderAccount,
          };

          logger.log("[StepOnboard] Storing onboarding data:", onboardingDataObject);
          setOnboardingData?.(onboardingDataObject);

          logger.log("[StepOnboard] Setting onboarding completed to true");
          setOnboardingCompleted?.(true);

          logger.log("[StepOnboard] Onboarding completion callbacks called");
        } else {
          logger.error("[StepOnboard] No partyId in onboarding result, not marking as completed");
        }

        setOnboardingStatus?.(OnboardStatus.SUCCESS);
        handleFinish();
      },
      error: (error: Error) => {
        logger.error("Canton account creation failed", error);
        setOnboardingStatus?.(OnboardStatus.ERROR);
        handleError(error);
      },
    });

    return () => {
      if (subscription) {
        logger.log("Cleaning up onboarding subscription");
        subscription.unsubscribe();
      }
    };
  }, [
    device,
    currency,
    retryCount,
    cantonBridge,
    accountName,
    placeholderAccount,
    handleStateUpdate,
    handleFinish,
    handleError,
    setOnboardingData,
    setOnboardingCompleted,
    setOnboardingStatus,
  ]);

  const handleRetry = useCallback(() => {
    clearError();
    resetState();
    retry();
  }, [clearError, resetState, retry]);

  const renderContent = (status: OnboardStatus) => {
    switch (status) {
      case OnboardStatus.PREPARE:
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
                <Trans i18nKey="addAccounts.sections.creatable.title" />
              </Box>

              <AccountRow
                account={placeholderAccount}
                accountName={accountName}
                isDisabled={true}
                hideAmount={true}
                isReadonly={true}
              />
            </Box>

            <LoadingRow>
              <Spinner color="palette.text.shade60" size={16} />
              <Box ml={2} ff="Inter|Regular" color="palette.text.shade60" fontSize={4}>
                {statusMessage}
              </Box>
            </LoadingRow>
          </Box>
        );

      case OnboardStatus.SIGN:
        if (!device) {
          return (
            <LoadingRow>
              <Spinner color="palette.text.shade60" size={16} />
            </LoadingRow>
          );
        }

        return (
          <TransactionConfirm
            device={device}
            account={placeholderAccount}
            parentAccount={null}
            transaction={
              {
                family: "canton",
                mode: "onboarding",
                recipient: signingData?.partyId || "",
                amount: new BigNumber(0),
                fee: new BigNumber(0),
                onboardingData: signingData,
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
            manifestId="canton-onboarding"
            manifestName="Canton Onboarding"
          />
        );

      case OnboardStatus.SUBMIT:
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
                <Trans i18nKey="addAccounts.sections.creatable.title" />
              </Box>

              <AccountRow
                account={placeholderAccount}
                accountName={accountName}
                isDisabled={true}
                hideAmount={true}
                isReadonly={true}
              />
            </Box>

            <LoadingRow>
              <Spinner color="palette.text.shade60" size={16} />
              <Box ml={2} ff="Inter|Regular" color="palette.text.shade60" fontSize={4}>
                {statusMessage}
              </Box>
            </LoadingRow>
          </Box>
        );

      case OnboardStatus.SUCCESS:
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
                <Trans i18nKey="addAccounts.sections.creatable.title" />
              </Box>

              <AccountRow
                account={placeholderAccount}
                accountName={accountName}
                isDisabled={true}
                hideAmount={true}
                isReadonly={true}
              />
            </Box>

            <Box>
              <Alert>
                <Trans i18nKey="canton.addAccount.combined.preapproval">
                  Your Canton account has been created and signed on device.
                </Trans>
              </Alert>
            </Box>
          </Box>
        );

      case OnboardStatus.ERROR:
        return (
          <Box>
            <Alert type="error" mb={4}>
              {error && <Text mt={2}>{error.message}</Text>}
            </Alert>

            <Button primary onClick={handleRetry}>
              <Trans i18nKey="common.retry">Retry</Trans>
            </Button>
          </Box>
        );

      default:
        return <></>;
    }
  };

  return renderContent(status);
}

export const StepOnboardFooter = ({
  currency,
  transitionTo,
  onboardingCompleted,
  isLoading = false,
  status,
}: FooterProps) => {
  const handleNext = useCallback(() => {
    logger.log("[StepOnboardFooter] Continue button clicked:", {
      onboardingCompleted,
      isLoading,
    });
    if (onboardingCompleted && !isLoading) {
      logger.log("StepOnboard: Transitioning to authorization");
      transitionTo(StepId.AUTHORIZE);
    } else {
      logger.warn("StepOnboard: Cannot transition - conditions not met");
    }
  }, [onboardingCompleted, isLoading, transitionTo]);

  // Hide footer during signing phase
  if (status === OnboardStatus.SIGN) {
    return <></>;
  }

  const isButtonDisabled = !onboardingCompleted || isLoading;

  return (
    <Box horizontal alignItems="center" justifyContent="space-between" grow>
      {currency && <CurrencyBadge currency={currency} />}
      <Button primary disabled={isButtonDisabled} onClick={handleNext}>
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
};

const LoadingRow = styled(Box).attrs(() => ({
  horizontal: true,
  borderRadius: 1,
  px: 3,
  alignItems: "center",
  justifyContent: "center",
  mt: 1,
}))`
  height: 48px;
  border: 1px dashed ${p => p.theme.colors.palette.text.shade60};
`;
