import { Button } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";

export default function OnboardingEntryPoint({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <Button
      mt="24px"
      iconPosition="right"
      onClick={onPress}
      outline={true}
      flexDirection="column"
      whiteSpace="normal"
    >
      {t("walletSync.entryPoints.onboarding.title")}
    </Button>
  );
}
