import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { useAllPostOnboardingActionsCompleted } from "@ledgerhq/live-common/postOnboarding/hooks/index";

import PostOnboardingHubContent from "~/renderer/components/PostOnboardingHub/PostOnboardingHubContent";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

const PostOnboardingScreen = () => {
  const { t } = useTranslation();
  const allDone = useAllPostOnboardingActionsCompleted();

  return (
    <Flex
      flexDirection="row"
      width="100%"
      height="100%"
      data-test-id="post-onboarding-hub-container"
    >
      <Flex
        justifyContent="center"
        flex={1}
        flexDirection="column"
        paddingLeft={100}
        paddingRight={50}
      >
        <Text variant="paragraph" fontSize={48} mb={8} whiteSpace="pre-wrap">
          {allDone
            ? t("postOnboarding.postOnboardingScreen.titleCompleted")
            : t("postOnboarding.postOnboardingScreen.title")}
        </Text>
      </Flex>
      <Flex flex={1} paddingRight={100} paddingLeft={50}>
        <PostOnboardingHubContent />
      </Flex>
    </Flex>
  );
};

export default withV3StyleProvider(PostOnboardingScreen);
