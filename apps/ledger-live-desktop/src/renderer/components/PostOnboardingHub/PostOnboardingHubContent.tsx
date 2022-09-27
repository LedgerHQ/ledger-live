import React, { useCallback } from "react";
import { Flex, Button, Box, Text } from "@ledgerhq/react-ui";
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

  return (
    <Flex flexDirection="column" justifyContent="center" height="100%" padding="20px">
      {!isInsidePostOnboardingScreen && (
        <Text variant="paragraph" fontSize="48px" mb="25px">
          {actionCompletedHubTitle || "Nice one.You're all set."}
        </Text>
      )}
      <Text variant="paragraph" color="neutral.c70" mb="25px">
        {"Here's what you can do next:"}
      </Text>
      <PostOnboardingHub />
      <Button
        onClick={() => (isInsidePostOnboardingScreen ? history.push("/") : setDrawer())}
        variant="color"
        outline={true}
        border="0px"
        width={isInsidePostOnboardingScreen ? "fit-content" : ""}
      >
        {isInsidePostOnboardingScreen ? "I'll do this later" : "Skip to the app"}
      </Button>
    </Flex>
  );
};

export default withV3StyleProvider(PostOnboardingHubContent);
