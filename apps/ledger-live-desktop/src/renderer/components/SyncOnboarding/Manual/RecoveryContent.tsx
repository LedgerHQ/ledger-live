import React from "react";
import { Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { StorylyWrapper, storyInstancesIDsMap } from "~/renderer/components/Storyly";

const RecoveryContent = () => {
  const { t } = useTranslation();

  return (
    <>
      <Text>{t("syncOnboarding.manual.recoveryContent.content")}</Text>
      <StorylyWrapper instanceID={storyInstancesIDsMap.onboarding_tips} />
    </>
  );
};

export default RecoveryContent;
