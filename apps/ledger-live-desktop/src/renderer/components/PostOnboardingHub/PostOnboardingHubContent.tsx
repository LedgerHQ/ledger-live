import React, { useCallback } from "react";
import { Flex, Link, Text } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";

import PostOnboardingHub from ".";
import { setDrawer } from "~/renderer/drawers/Provider";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

const PostOnboardingHubContent = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const { lastActionCompleted } = usePostOnboardingHubState();
  const { actionCompletedHubTitle } = lastActionCompleted ?? {};

  const isInsidePostOnboardingScreen = history.location.pathname === "/post-onboarding";

  const handleSkipButton = useCallback(() => {
    isInsidePostOnboardingScreen ? history.push("/") : setDrawer();
  }, [history, isInsidePostOnboardingScreen]);

  return (
    <Flex
      px={3}
      ml={4}
      flexDirection="column"
      justifyContent="center"
      height="100%"
      width="100%"
      maxWidth={450}
    >
      {!isInsidePostOnboardingScreen && (
        <Text variant="paragraph" fontSize={48} mb={8}>
          {actionCompletedHubTitle || t("postOnboarding.postOnboardingContent.title")}
        </Text>
      )}
      <Text variant="paragraph" fontSize={14} color="neutral.c70" mb={8}>
        {t("postOnboarding.postOnboardingContent.description")}
      </Text>
      <PostOnboardingHub />
      <Link
        onClick={handleSkipButton}
        type="color"
        width={isInsidePostOnboardingScreen ? "fit-content" : ""}
      >
        {isInsidePostOnboardingScreen
          ? t("postOnboarding.postOnboardingContent.skipLinkInDrawer")
          : t("postOnboarding.postOnboardingContent.skipLink")}
      </Link>
    </Flex>
  );
};

export default withV3StyleProvider(PostOnboardingHubContent);
