import { Box, Text } from "@ledgerhq/react-ui";
import React from "react";
import { CurrencyCircleIcon } from "~/renderer/components/CurrencyBadge";
import { StableStepProps } from "./types";

export default function StepFinish({
  currency,
  t,
  creatableAccount,
  importableAccounts,
  isReonboarding,
}: StableStepProps) {
  const accounts = [...importableAccounts, creatableAccount];

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      py={6}
      role="status"
      aria-live="polite"
    >
      <CurrencyCircleIcon
        currency={currency}
        size={50}
        showCheckmark
        aria-label={`${currency.name} account created successfully`}
      />
      <Text
        variant="h3"
        fontSize={20}
        fontWeight="semiBold"
        color="neutral.c100"
        mt={2}
        textAlign="center"
      >
        {isReonboarding
          ? t("families.canton.addAccount.reonboard.success", { count: accounts.length })
          : t("addAccounts.success", { count: accounts.length })}
      </Text>
      <Text variant="body" fontSize={14} color="neutral.c80" mt={2} textAlign="center">
        {isReonboarding
          ? t("families.canton.addAccount.reonboard.successDescription", { count: accounts.length })
          : t("families.canton.addAccount.onboard.successDescription", { count: accounts.length })}
      </Text>
    </Box>
  );
}
