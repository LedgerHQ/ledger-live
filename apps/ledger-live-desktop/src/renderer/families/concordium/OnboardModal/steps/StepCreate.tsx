import React, { useCallback, useEffect, useRef, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyBadge from "~/renderer/components/CurrencyBadge";
import Spinner from "~/renderer/components/Spinner";
import Text from "~/renderer/components/Text";
import useInterval from "~/renderer/hooks/useInterval";
import { TransactionConfirm } from "../components/TransactionConfirm";
import { SectionAccounts } from "../components/SectionAccounts";
import { formatOnboardingError } from "../utils/errorFormatting";
import { StepProps } from "../types";

const getStatusMessage = (status?: AccountOnboardStatus): string => {
  switch (status) {
    case AccountOnboardStatus.PREPARE:
      return "families.concordium.addAccount.create.status.prepare";
    case AccountOnboardStatus.SUBMIT:
      return "families.concordium.addAccount.create.status.submit";
    default:
      return "families.concordium.addAccount.create.status.default";
  }
};

const RESEND_DELAY_SECONDS = 10;

const StepCreate = ({
  device,
  currency,
  accountName,
  editedNames,
  creatableAccount,
  importableAccounts,
  onboardingStatus,
  error,
  confirmationCode,
  onResendCreateAccount,
  t,
}: StepProps) => {
  const [resendTimeRemaining, setResendTimeRemaining] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const canResend = resendTimeRemaining === 0 && startTimeRef.current !== null;

  useEffect(() => {
    const isPrepareState = onboardingStatus === AccountOnboardStatus.PREPARE && confirmationCode;

    if (isPrepareState) {
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
        setResendTimeRemaining(RESEND_DELAY_SECONDS);
      }
    } else {
      startTimeRef.current = null;
      setResendTimeRemaining(0);
    }
  }, [onboardingStatus, confirmationCode]);

  useInterval(
    () => {
      if (!startTimeRef.current) return;
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, RESEND_DELAY_SECONDS - elapsed);
      setResendTimeRemaining(remaining);
    },
    startTimeRef.current && resendTimeRemaining > 0 ? 1000 : 0,
  );

  const handleResend = useCallback(() => {
    startTimeRef.current = Date.now();
    setResendTimeRemaining(RESEND_DELAY_SECONDS);
    onResendCreateAccount();
  }, [onResendCreateAccount]);

  const renderContent = () => {
    switch (true) {
      case onboardingStatus === AccountOnboardStatus.PREPARE && !!confirmationCode:
        return (
          <Box mb={4}>
            <ConfirmationCodeSection>
              <Trans i18nKey="families.concordium.addAccount.create.prepare.title" />

              <ConfirmationCodeDisplay role="group" aria-label="Confirmation code">
                {confirmationCode.split("").map((digit, index) => (
                  <ConfirmationCodeDigit key={index} aria-hidden="true">
                    {digit}
                  </ConfirmationCodeDigit>
                ))}
                <VisuallyHidden>{confirmationCode}</VisuallyHidden>
              </ConfirmationCodeDisplay>

              <Box mt={3}>
                {canResend ? (
                  <Button onClick={handleResend}>
                    <Trans i18nKey="families.concordium.addAccount.create.prepare.resendButton" />
                  </Button>
                ) : (
                  <ResendDescription>
                    <Trans
                      i18nKey="families.concordium.addAccount.create.prepare.resendDescription"
                      values={{
                        count: resendTimeRemaining,
                        unit: t("time.second", { count: resendTimeRemaining }),
                      }}
                    >
                      <Text fontWeight="600" />
                    </Trans>
                  </ResendDescription>
                )}
              </Box>
            </ConfirmationCodeSection>
          </Box>
        );

      case onboardingStatus === AccountOnboardStatus.SIGN:
        return <TransactionConfirm device={device} />;

      case onboardingStatus === AccountOnboardStatus.SUCCESS:
        return (
          <Box>
            <Alert type="success">
              <Trans i18nKey="families.concordium.addAccount.create.success" />
            </Alert>
          </Box>
        );

      case onboardingStatus === AccountOnboardStatus.ERROR:
        return (
          <Box>
            <Alert type="error">{formatOnboardingError(error, "create")}</Alert>
          </Box>
        );

      default:
        return (
          <LoadingRow>
            <Spinner color="palette.text.shade60" size={16} />
            <Box ml={2} ff="Inter|Regular" color="palette.text.shade60" fontSize={4}>
              <Trans i18nKey={getStatusMessage(onboardingStatus)} />
            </Box>
          </LoadingRow>
        );
    }
  };

  return (
    <Box>
      <SectionAccounts
        currency={currency}
        accountName={accountName}
        editedNames={editedNames}
        creatableAccount={creatableAccount}
        importableAccounts={importableAccounts}
      />

      {renderContent()}
    </Box>
  );
};

export const StepCreateFooter = ({
  currency,
  isProcessing,
  onboardingStatus,
  onCreateAccount,
  onAddAccounts,
}: StepProps) => {
  const renderActionButton = () => {
    switch (onboardingStatus) {
      case AccountOnboardStatus.SUCCESS:
        return (
          <Button primary disabled={isProcessing} onClick={onAddAccounts}>
            <Trans i18nKey="common.continue" />
          </Button>
        );

      case AccountOnboardStatus.ERROR:
        return (
          <Button primary disabled={isProcessing} onClick={onCreateAccount}>
            <Trans i18nKey="common.tryAgain" />
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Box horizontal alignItems="center" justifyContent="space-between" grow>
      <CurrencyBadge currency={currency} />
      {renderActionButton()}
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
  border: 1px dashed ${p => p.theme.colors.neutral.c60};
`;

const ConfirmationCodeSection = styled(Box).attrs(() => ({
  flex: 1,
  fontSize: 4,
}))`
  border-radius: 4px;
  align-items: center;
  text-align: center;
  background-color: ${p => p.theme.colors.neutral.c20};
  color: ${p => p.theme.colors.neutral.c100};
  border: 1px dashed ${p => p.theme.colors.neutral.c40};
  padding: 24px 48px;
`;

const ConfirmationCodeDisplay = styled(Box).attrs(() => ({
  horizontal: true,
}))`
  gap: 8px;
  margin: 16px 0;
`;

const ConfirmationCodeDigit = styled(Box).attrs(() => ({
  alignItems: "center",
  justifyContent: "center",
}))`
  width: 48px;
  height: 64px;
  background: ${p => p.theme.colors.background.card};
  border: 2px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 8px;
  font-family: "Inter", sans-serif;
  font-size: 32px;
  font-weight: 600;
  color: ${p => p.theme.colors.neutral.c100};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ResendDescription = styled(Text).attrs(() => ({
  ff: "Inter|Regular",
  fontSize: 3,
  color: "palette.text.shade60",
}))`
  text-align: center;
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export default StepCreate;
