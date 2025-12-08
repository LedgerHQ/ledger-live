import { Flex, IconBox, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import LedgerIcon from "~/icons/Ledger";
import { DynamicStepProps, StableStepProps } from "../types";

export default function StepFinish({
  importableAccounts,
  onboardingResult,
  isReonboarding,
}: StableStepProps & DynamicStepProps) {
  const { t } = useTranslation();

  const accounts = [...importableAccounts];
  if (onboardingResult?.completedAccount) {
    accounts.push(onboardingResult.completedAccount);
  }

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" flex={1} px={6}>
      <IconBox Icon={LedgerIcon} iconSize={24} />
      <Text variant="h4" fontSize="24px" color="neutral.c100" mt={4} textAlign="center">
        {isReonboarding
          ? t("canton.onboard.reonboard.success")
          : t("addAccounts.success", { count: accounts.length })}
      </Text>
      <Text variant="body" color="neutral.c70" mt={2} textAlign="center">
        {isReonboarding
          ? t("canton.onboard.reonboard.successDescription")
          : t("addAccounts.successDescription", { count: accounts.length })}
      </Text>
    </Flex>
  );
}
