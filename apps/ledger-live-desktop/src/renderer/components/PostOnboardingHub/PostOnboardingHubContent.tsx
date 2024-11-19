import React, { useCallback } from "react";
import { Flex, Link } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useAllPostOnboardingActionsCompleted,
  usePostOnboardingHubState,
} from "@ledgerhq/live-common/postOnboarding/hooks/index";
import PostOnboardingHub from ".";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { track } from "~/renderer/analytics/segment";
import ButtonV3 from "~/renderer/components/ButtonV3";

const PostOnboardingHubContent = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const areAllPostOnboardingActionsCompleted = useAllPostOnboardingActionsCompleted();
  const { deviceModelId } = usePostOnboardingHubState();

  const handleSkipButton = useCallback(() => {
    track("button_clicked2", {
      button: "I'll do this later",
      deviceModelId,
      flow: "post-onboarding",
    });
    history.push("/");
  }, [history, deviceModelId]);

  const handleOnboardingOver = useCallback(() => {
    track("button_clicked2", { button: "Explore wallet", deviceModelId, flow: "post-onboarding" });
    history.push("/");
  }, [history, deviceModelId]);

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
      <PostOnboardingHub />
      {!areAllPostOnboardingActionsCompleted ? (
        <Link onClick={handleSkipButton} data-testid={"postonboarding-hub-skip-button"} mt={5}>
          {t("postOnboarding.postOnboardingContent.skipLink")}
        </Link>
      ) : (
        <ButtonV3
          big
          variant="main"
          mt={3}
          onClick={handleOnboardingOver}
          buttonTestId="postonboarding-hub-explore-button"
        >
          {t("postOnboarding.postOnboardingScreen.exploreCTA")}
        </ButtonV3>
      )}
    </Flex>
  );
};

export default withV3StyleProvider(PostOnboardingHubContent);
