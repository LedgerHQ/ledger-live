import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { CurrencyCircleIcon } from "~/renderer/components/CurrencyBadge";
import { StepProps } from "../types";

export default function StepFinish({
  t,
  currency,
  creatableAccount,
  importableAccounts,
}: StepProps) {
  const accounts = [...importableAccounts, creatableAccount];
  return (
    <Box alignItems="center" py={6}>
      {currency ? <CurrencyCircleIcon currency={currency} size={50} showCheckmark /> : null}
      <Title>
        {t("addAccounts.success", {
          count: accounts.length,
        })}
      </Title>
      <Text>
        {t("addAccounts.successDescription", {
          count: accounts.length,
        })}
      </Text>
    </Box>
  );
}

export const StepFinishFooter = ({
  t,
  currency: _currency,
  closeModal: _closeModal,
  onAddAccounts,
  importableAccounts,
  onboardingData,
}: StepProps) => {
  const onGoStep1 = () => {
    const completedAccount = onboardingData?.completedAccount;
    if (completedAccount) {
      onAddAccounts([...importableAccounts, completedAccount]);
    }
  };

  const onDone = () => {
    const completedAccount = onboardingData?.completedAccount;
    if (completedAccount) {
      onAddAccounts([...importableAccounts, completedAccount]);
    }
  };

  return (
    <Box horizontal alignItems="center" justifyContent="space-between" grow>
      <Button
        event="Page AddAccounts Step 4 AddMore"
        data-testid={"add-accounts-finish-add-more-button"}
        outlineGrey
        onClick={onGoStep1}
      >
        {t("addAccounts.cta.addMore")}
      </Button>
      <Button
        event="Page AddAccounts Step 4 Close"
        data-testid={"add-accounts-finish-close-button"}
        primary
        onClick={onDone}
      >
        {t("common.done")}
      </Button>
    </Box>
  );
};

const Title = styled(Box).attrs(() => ({
  ff: "Inter",
  fontSize: 5,
  mt: 2,
  color: "palette.text.shade100",
}))`
  text-align: center;
`;

const Text = styled(Box).attrs(() => ({
  ff: "Inter",
  fontSize: 4,
  mt: 2,
}))`
  text-align: center;
`;
