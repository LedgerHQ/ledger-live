import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { CurrencyCircleIcon } from "~/renderer/components/CurrencyBadge";
import { StepProps } from "../types";

export default function StepFinish({ t, currency, selectedAccounts }: StepProps) {
  return (
    <Box alignItems="center" py={6}>
      {currency ? <CurrencyCircleIcon currency={currency} size={50} showCheckmark /> : null}
      <Title>
        {t("addAccounts.success", {
          count: selectedAccounts.length,
        })}
      </Title>
      <Text>
        {t("addAccounts.successDescription", {
          count: selectedAccounts.length,
        })}
      </Text>
    </Box>
  );
}

export const StepFinishFooter = ({
  t,
  currency,
  closeModal,
  onAccountCreated,
  onboardingData,
}: StepProps) => {
  const onGoStep1 = () => {
    console.log("[StepFinish] Add Account clicked, calling onAccountCreated");
    const completedAccount = onboardingData?.completedAccount;
    if (completedAccount) {
      onAccountCreated(completedAccount);
    } else {
      console.error("[StepFinish] No completed account found in modal state");
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
        event="Page AddAccounts Step 4 AddMore"
        data-testid={"add-accounts-finish-close-button"}
        primary
        onClick={closeModal}
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
