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

const StepAuthorize = ({ accountName, authorizeStatus, device, onboardingData }: StepProps) => {
  invariant(onboardingData?.completedAccount, "canton: completed account is required");

  const renderContent = (status: AuthorizeStatus) => {
    switch (status) {
      case AuthorizeStatus.SIGN:
        return (
          <TransactionConfirm
            device={device}
            account={onboardingData.completedAccount}
            message="Canton Authorize"
          />
        );
      default:
        return (
          <SectionAuthorizze>
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
                <Trans i18nKey="canton.addAccount.authorization.validatorLabel">Authorize</Trans>
              </Box>

              <ValidatorRow isSelected={true} disabled={false} />
            </Box>

            <Alert>
              <Trans i18nKey="canton.addAccount.combined.preapproval">
                Automaticaly accept incoming funds to this account. <br />
                <Link href="https://ledger.com" type="external">
                  <Trans i18nKey="common.learnMore" />
                </Link>
              </Trans>
            </Alert>
          </SectionAuthorizze>
        );
    }
  };

  return renderContent(authorizeStatus);
};
export const StepAuthorizeFooter = ({
  currency,
  authorizeStatus,
  onAuthorizePreapproval,
}: StepProps) => {
  if (authorizeStatus === AuthorizeStatus.SIGN) {
    return <></>;
  }

  return (
    <Box horizontal alignItems="center" justifyContent="space-between" grow>
      <CurrencyBadge currency={currency} />
      <Button
        primary
        onClick={onAuthorizePreapproval}
        disabled={authorizeStatus === AuthorizeStatus.SUBMIT}
      >
        {authorizeStatus === AuthorizeStatus.SUBMIT && (
          <Box mr={2}>
            <Spinner size={20} />
          </Box>
        )}
        <Trans i18nKey="canton.addAccount.authorization.startPreapproval">Confirm</Trans>
      </Button>
    </Box>
  );
};

const SectionAuthorizze = styled(Box)`
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
