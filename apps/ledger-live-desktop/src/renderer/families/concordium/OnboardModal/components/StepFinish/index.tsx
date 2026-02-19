import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import { CurrencyCircleIcon } from "~/renderer/components/CurrencyBadge";
import { SectionAccounts } from "../SectionAccounts";
import { StepProps } from "../../types";

const StepFinish = ({
  t,
  accountName,
  editedNames,
  currency,
  creatableAccount,
  importableAccounts,
}: StepProps) => {
  const accounts = [...importableAccounts, creatableAccount].filter(Boolean);

  return (
    <Box>
      <SectionAccounts
        currency={currency}
        accountName={accountName}
        editedNames={editedNames}
        creatableAccount={creatableAccount}
        importableAccounts={importableAccounts}
        showImportableAccounts
      />

      <Box alignItems="center" py={6} role="status" aria-live="polite">
        <CurrencyCircleIcon
          currency={currency}
          size={50}
          showCheckmark
          aria-label={`${currency.name} account created successfully`}
        />
        <Title>{t("addAccounts.success", { count: accounts.length })}</Title>
      </Box>
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

export default StepFinish;
