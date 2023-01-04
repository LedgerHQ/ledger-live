import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Flex, Link, Text } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { clearPostOnboardingLastActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";

import PostOnboardingHub from ".";
import { setDrawer } from "~/renderer/drawers/Provider";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

const PostOnboardingHubContent = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const dispatch = useDispatch();

  const isInsidePostOnboardingScreen = history.location.pathname === "/post-onboarding";

  const clearLastActionCompleted = useCallback(() => {
    dispatch(clearPostOnboardingLastActionCompleted());
    setDrawer();
  }, [dispatch]);

  const handleSkipButton = useCallback(() => {
    isInsidePostOnboardingScreen ? history.push("/") : clearLastActionCompleted();
  }, [clearLastActionCompleted, history, isInsidePostOnboardingScreen]);

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
          {t("postOnboarding.postOnboardingContent.title")}
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
        data-test-id={
          isInsidePostOnboardingScreen
            ? "postonboarding-hub-screen-skip-button"
            : "postonboarding-hub-drawer-skip-button"
        }
      >
        {isInsidePostOnboardingScreen
          ? t("postOnboarding.postOnboardingContent.skipLinkInDrawer")
          : t("postOnboarding.postOnboardingContent.skipLink")}
      </Link>
    </Flex>
  );
};

export default withV3StyleProvider(PostOnboardingHubContent);
