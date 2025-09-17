import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { CurrencyCircleIcon } from "~/renderer/components/CurrencyBadge";
import { StepProps } from "../types";

/**
 * Final step component showing successful account creation
 * Displays success message and account information
 */
export default function StepFinish({
  t,
  currency,
  creatableAccount,
  importableAccounts,
}: StepProps) {
  const accounts = [...importableAccounts, creatableAccount];

  return (
    <Box alignItems="center" py={6} role="status" aria-live="polite">
      {currency ? (
        <CurrencyCircleIcon
          currency={currency}
          size={50}
          showCheckmark
          aria-label={`${currency.name} account created successfully`}
        />
      ) : null}
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

/**
 * Footer component for the final step
 * Provides actions to add more accounts or complete the process
 */
export const StepFinishFooter = ({
  t,
  currency: _currency,
  closeModal: _closeModal,
  onAddAccounts,
  importableAccounts,
  onboardingData,
}: StepProps) => {
  const handleAddMore = () => {
    const completedAccount = onboardingData?.completedAccount;
    if (completedAccount) {
      onAddAccounts([...importableAccounts, completedAccount]);
    }
  };

  const handleDone = () => {
    const completedAccount = onboardingData?.completedAccount;
    if (completedAccount) {
      onAddAccounts([...importableAccounts, completedAccount]);
    }
  };

  return (
    <Box horizontal alignItems="center" justifyContent="space-between" grow>
      <Button
        event="Page AddAccounts Step 4 AddMore"
        data-testid="add-accounts-finish-add-more-button"
        outlineGrey
        onClick={handleAddMore}
        aria-label="Add more Canton accounts"
      >
        {t("addAccounts.cta.addMore")}
      </Button>
      <Button
        event="Page AddAccounts Step 4 Close"
        data-testid="add-accounts-finish-close-button"
        primary
        onClick={handleDone}
        aria-label="Complete Canton account setup"
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
