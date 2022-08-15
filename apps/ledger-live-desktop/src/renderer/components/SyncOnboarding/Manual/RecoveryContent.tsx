import React from "react";
import { Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { StorylyWrapper } from "~/renderer/components/Storyly";

const RecoveryContent = () => {
  const { t } = useTranslation();

  return (
    <>
      <Text>{t("syncOnboarding.manual.recoveryContent.content")}</Text>
      <StorylyWrapper instanceID="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NfaWQiOjY5NDgsImFwcF9pZCI6MTE0MjIsImluc19pZCI6MTI0ODh9.gFt9c5R8rLsnYpZfoBBchKqo9nEJJs5_G3-i215mTlU" />
    </>
  );
};

export default RecoveryContent;
