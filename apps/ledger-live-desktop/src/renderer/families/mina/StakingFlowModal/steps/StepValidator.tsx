import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import ValidatorList from "../components/ValidatorList";
import { StepProps } from "../types";

const Container = styled(Box).attrs(() => ({
  flex: 1,
  mb: 4,
}))``;

const StepValidator = ({ account, transaction, onUpdateTransaction, error }: StepProps) => {
  const { t } = useTranslation();
  if (!transaction) return null;
  if (!account) return null;

  return (
    <Container>
      <TrackPage category="Delegation Flow" name="Step Validator" />
      {error && <ErrorBanner error={error} />}
      <Box>
        <ValidatorList
          account={account}
          transaction={transaction}
          onUpdateTransaction={onUpdateTransaction}
        />
      </Box>
    </Container>
  );
};

export function StepValidatorFooter({
  transitionTo,
  onClose,
  transaction,
  account,
  parentAccount,
  status,
}: Readonly<StepProps>) {
  const { t } = useTranslation();
  if (!account) return null;

  const canContinue =
    transaction?.recipient && transaction.recipient !== account.resources?.delegateInfo?.address;

  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          id="stake-continue-button"
          disabled={!canContinue}
          primary
          onClick={() => transitionTo("connectDevice")}
        >
          {t("common.continue")}
        </Button>
      </Box>
    </>
  );
}

export default StepValidator;
