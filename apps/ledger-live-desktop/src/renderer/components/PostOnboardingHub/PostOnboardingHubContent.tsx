import React, { useCallback } from "react";
import { Flex, Link } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAllPostOnboardingActionsCompleted } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import PostOnboardingHub from ".";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { track } from "~/renderer/analytics/segment";
import ButtonV3 from "~/renderer/components/ButtonV3";

const PostOnboardingHubContent = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const allDone = useAllPostOnboardingActionsCompleted();

  const handleSkipButton = useCallback(() => {
    track("button_clicked2", { button: "I'll do this later", flow: "post-onboarding" });
    history.push("/");
  }, [history]);

  const handleOnboardingOver = useCallback(() => {
    track("button_clicked2", { button: "Explore wallet", flow: "post-onboarding" });
    history.push("/");
  }, [history]);

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
      {!allDone ? (
        <Link onClick={handleSkipButton} data-test-id={"postonboarding-hub-skip-button"} mt={5}>
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
