import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";

import { StorylyWrapper, storyInstancesIDsMap } from "~/renderer/components/Storyly";
import { StepText } from "./shared";

const RecoveryContent = () => {
  const { t } = useTranslation();

  return (
    <Flex flexDirection="column">
      <StepText mb={6}>{t("syncOnboarding.manual.recoveryContent.content")}</StepText>
      <StorylyWrapper instanceID={storyInstancesIDsMap.onboarding_tips} />
    </Flex>
  );
};

export default RecoveryContent;
