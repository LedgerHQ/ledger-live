import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { CurrencyCircleIcon } from "~/renderer/components/CurrencyBadge";
import { StepProps } from "../types";

const StepFinish = ({
  t,
  currency,
  creatableAccount,
  importableAccounts,
  isReonboarding,
}: StepProps) => {
  const accounts = [...importableAccounts, creatableAccount];

  return (
    <Box alignItems="center" py={6} role="status" aria-live="polite">
      <CurrencyCircleIcon
        currency={currency}
        size={50}
        showCheckmark
        aria-label={`${currency.name} account created successfully`}
      />
      <Title>
        {isReonboarding
          ? t("families.canton.addAccount.reonboard.success")
          : t("addAccounts.success", { count: accounts.length })}
      </Title>
      <Text>
        {isReonboarding
          ? t("families.canton.addAccount.reonboard.successDescription")
          : t("addAccounts.successDescription", { count: accounts.length })}
      </Text>
    </Box>
  );
};

export const StepFinishFooter = ({ t, onAddAccounts, onAddMore, isReonboarding }: StepProps) => {
  return (
    <Box
      horizontal
      alignItems="center"
      justifyContent={isReonboarding ? "flex-end" : "space-between"}
      grow
    >
      {!isReonboarding && (
        <Button
          event="Page AddAccounts Step 4 AddMore"
          data-testid="add-accounts-finish-add-more-button"
          outlineGrey
          onClick={onAddMore}
          aria-label="Add more Canton accounts"
        >
          {t("addAccounts.cta.addMore")}
        </Button>
      )}
      <Button
        event="Page AddAccounts Step 4 Close"
        data-testid="add-accounts-finish-close-button"
        primary
        onClick={onAddAccounts}
        aria-label="Complete Canton account setup"
      >
        {isReonboarding ? t("common.continue") : t("common.done")}
      </Button>
    </Box>
  );
};

const Title = styled(Box).attrs(() => ({
  ff: "Inter",
  fontSize: 5,
  mt: 2,
  color: "neutral.c100",
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

export default StepFinish;
