import React from "react";
import styled from "styled-components";
import invariant from "invariant";
import { Trans } from "react-i18next";
import { AuthorizeStatus } from "@ledgerhq/coin-canton/types";
import AccountRow from "~/renderer/components/AccountsList/AccountRow";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyBadge from "~/renderer/components/CurrencyBadge";
import Link from "~/renderer/components/Link";
import Spinner from "~/renderer/components/Spinner";
import { TransactionConfirm } from "../components/TransactionConfirm";
import { ValidatorRow } from "../components/ValidatorRow";
import { StepProps } from "../types";

const StepAuthorize = ({ accountName, authorizeStatus, device, onboardingResult }: StepProps) => {
  invariant(onboardingResult?.completedAccount, "canton: completed account is required");

  const renderContent = (status: AuthorizeStatus) => {
    switch (status) {
      case AuthorizeStatus.SIGN:
        return <TransactionConfirm device={device} />;
      default:
        return (
          <SectionAuthorize>
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
                account={onboardingResult.completedAccount}
                accountName={accountName}
                isDisabled={false}
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
                <Trans i18nKey="canton.addAccount.auth.validator">Authorize</Trans>
              </Box>

              <ValidatorRow isSelected={true} disabled={false} />
            </Box>

            {status === AuthorizeStatus.ERROR ? (
              <Alert type="error">
                <Trans i18nKey="canton.addAccount.auth.error">
                  Failed to authorize preapproval. Please try again.
                </Trans>
              </Alert>
            ) : (
              <Alert>
                <Trans i18nKey="canton.addAccount.auth.hint">
                  Automaticaly accept incoming funds to this account.
                </Trans>
                <br />
                <Link href="https://ledger.com" type="external">
                  <Trans i18nKey="common.learnMore" />
                </Link>
              </Alert>
            )}
          </SectionAuthorize>
        );
    }
  };

  return renderContent(authorizeStatus);
};
export const StepAuthorizeFooter = ({
  currency,
  authorizeStatus,
  isProcessing,
  onAuthorizePreapproval,
  onRetry,
}: StepProps) => {
  if (authorizeStatus === AuthorizeStatus.SIGN) {
    return <></>;
  }

  const renderContent = (authorizeStatus: AuthorizeStatus) => {
    switch (authorizeStatus) {
      case AuthorizeStatus.ERROR:
        return (
          <Button primary onClick={onRetry}>
            <Trans i18nKey="common.tryAgain" />
          </Button>
        );
      case AuthorizeStatus.SUBMIT:
        return (
          <Button primary disabled={isProcessing}>
            <Box mr={2}>
              <Spinner size={20} />
            </Box>
            <Trans i18nKey="common.confirm" />
          </Button>
        );
      default:
        return (
          <Button primary onClick={onAuthorizePreapproval} disabled={isProcessing}>
            <Trans i18nKey="common.confirm" />
          </Button>
        );
    }
  };

  return (
    <Box horizontal alignItems="center" justifyContent="space-between" grow>
      <CurrencyBadge currency={currency} />
      {renderContent(authorizeStatus)}
    </Box>
  );
};

const SectionAuthorize = styled(Box)`
  position: relative;
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
`;

export default StepAuthorize;
