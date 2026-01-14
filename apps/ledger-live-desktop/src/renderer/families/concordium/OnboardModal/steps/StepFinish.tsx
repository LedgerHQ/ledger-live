import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { CurrencyCircleIcon } from "~/renderer/components/CurrencyBadge";
import { StepProps } from "../types";

const StepFinish = ({ t, currency, creatableAccount, importableAccounts }: StepProps) => {
  const accounts = [...importableAccounts, creatableAccount];

  return (
    <Box alignItems="center" py={6} role="status" aria-live="polite">
      <CurrencyCircleIcon
        currency={currency}
        size={50}
        showCheckmark
        aria-label={`${currency.name} account created successfully`}
      />
      <Title>{t("addAccounts.success", { count: accounts.length })}</Title>
      <Text>
        {t("addAccounts.successDescription", {
          count: accounts.length,
        })}
      </Text>
    </Box>
  );
};

export const StepFinishFooter = ({ t, onAddAccounts }: StepProps) => {
  return (
    <Box horizontal alignItems="center" justifyContent="flex-end" grow>
      <Button
        event="Page AddAccounts Step 2 Close"
        data-testid="add-accounts-finish-close-button"
        primary
        onClick={onAddAccounts}
        aria-label="Complete Concordium account setup"
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

export default StepFinish;
