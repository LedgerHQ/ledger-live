import React, { useCallback } from "react";
import { Flex, Link, Text } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { clearPostOnboardingLastActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";

import PostOnboardingHub from ".";
import { setDrawer } from "~/renderer/drawers/Provider";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

const PostOnboardingHubContent = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const history = useHistory();
  const { lastActionCompleted, actionsState } = usePostOnboardingHubState();
  const { actionCompletedHubTitle, actionCompletedPopupLabel } = lastActionCompleted ?? {};
  const clearLastActionCompleted = useCallback(() => {
    dispatch(clearPostOnboardingLastActionCompleted());
  }, [dispatch]);

  const isInsidePostOnboardingScreen = history.location.pathname === "/post-onboarding";

  // useEffect(() => clearLastActionCompleted, []);

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
